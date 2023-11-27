// https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/router.md

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { io } = require("socket.io-client");
const customParse = require("socket.io-msgpack-parser");
const WebSocket = require("ws");


const ws = new WebSocket("ws://host.docker.internal:3031/ws");
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

            if (socket['userCount'] >= 10) {
                console.log("LB - creating new container");
                ws.send(`{"Type": "create", "Port": "${sockets.length + 3000}"}`);
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
                    sockets["http://172.20.0.6:3000"].socket.emit("new-socket", {"socket-url": data.URL});

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

    let min = sockets["http://172.20.0.6:3000"]['userCount'];
    let minAddress = "http://172.20.0.6:3000";

    for (const [key, value] of Object.entries(sockets)) {
        if (sockets[key]['userCount'] < min) {
            min = sockets[key]['userCount'];
            minAddress = key;
        }
    }
    console.log("client connection");
    return minAddress;
}

const options = {
    target: 'http://172.20.0.6:3000',
    router: customRouter
};


const wsProxy = createProxyMiddleware(options);
app.use(wsProxy);


for (const [key, value] of Object.entries(sockets)) {
    startCountUpdater(value);
}


const server = app.listen(3030);
server.on('upgrade', wsProxy.upgrade); // <-- subscribe to http 'upgrade'