// https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/router.md

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { io } = require("socket.io-client");
const customParse = require("socket.io-msgpack-parser");

const sockets = [
    {
        URL: "http://172.20.0.6:3000",
        socket: io("http://172.20.0.6:3000", { autoConnect: false, parser: customParse }),
        userCount: 0
    },
    /*
    {
        URL: "http://172.19.0.2:3001",
        socket: io("http://172.19.0.2:3001", { autoConnect: false, parser: customParse }),
        userCount: 0
    } */
];


const startCountUpdater = (socket) => {
    socket['socket'].connect();
    console.log(socket["URL"]);
    socket['socket'].on("client-count", (count) => {
        console.log(socket['URL'], count);
        
        try {
            socket['userCount'] = parseInt(count);
        } catch (error) {

        }
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


for (let i = 0; i < sockets.length; i++) {
    startCountUpdater(sockets[i]);
}


const server = app.listen(3030);
server.on('upgrade', wsProxy.upgrade); // <-- subscribe to http 'upgrade'