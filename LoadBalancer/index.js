// https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/router.md

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { io } = require("socket.io-client");
const customParse = require("socket.io-msgpack-parser");
import { WebSocket } from "ws";


const ws = new WebSocket("ws://localhost:3031/ws");
ws.on("error", console.error);

var sockets = {
    "http://172.20.0.6:3000" : {
        URL: "http://172.20.0.6:3000",
        socket: io("http://172.20.0.6:3000", { autoConnect: false, parser: customParse }),
        userCount: 0 
    }
}

const startCountUpdater = (socket) => {
    socket['socket'].connect();
    console.log(socket["URL"]);
    socket['socket'].on("client-count", (count) => {
        console.log(socket['URL'], count);
        
        try {
            socket['userCount'] = parseInt(count);

            if (socket['userCount'] >= 250) {
                ws.send(`{"Port": "${sockets.length + 3000}"}`);
            }
        } catch (error) {}


        ws.on("response", (data) => {
            if (data.Code == 200) {
                if (data.Type == "create") {
                    sockets[data.URL] = {
                        URL: data.URL,
                        socket: io(data.URL, { autoConnect: false, parser: customParse }),
                        userCount: 0
                    }
                    startCountUpdater(sockets[data.URL]);
                }
                if (data.Type == "delete") {
                    // remove the socket
                }
            } else {
                // then there was a failure creating the new websocket server
            }
        });
    });

    setInterval(() => {
        socket['socket'].emit("client-count-request");
    }, 5000);

};

const app = express()

// route to the server with the least number of users
const customRouter = (req) => {

    let min = sockets[0]['userCount'];
    let minIndex = 0;
    for (let i = 1; i < sockets.length; i++) {
        if (sockets[i]['userCount'] < min) {
            min = sockets[i]['userCount'];
            minIndex = i;
        }
    }
    
    console.log("client connection");
    return sockets[minIndex]['URL'];
}

const options = {
    target: 'http://localhost:3001',
    router: customRouter
};


const wsProxy = createProxyMiddleware(options);
app.use(wsProxy);


for (const [key, value] of Object.entries(sockets)) {
    startCountUpdater(value);
}


const server = app.listen(3030);
server.on('upgrade', wsProxy.upgrade); // <-- subscribe to http 'upgrade'