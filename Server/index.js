const httpServer = require("http").createServer();
const { Server } = require("socket.io");
const customParse = require("socket.io-msgpack-parser");
const os = require('os');
const serverAddress = os.networkInterfaces()['eth0'][0]['address'];


const io = new Server(httpServer, {
    parser: customParse,
    transports: ["websocket"]
});

const socketPort = process.argv.slice(2)[0];
if (socketPort == null) {
    console.log("A port was not given");
    process.exit(1);
}

var connectionCount = 0;

io.of("/user").on("connection", (socket) => {
    connectionCount++;
    io.emit("client-count", connectionCount);

    socket.on("disconnect", () => {
        connectionCount--;
    });
});

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on("client-count-request", () => { 
        console.log("client-count-request");
        socket.emit("client-count", connectionCount);
    });

    socket.on("new-socket", (payload) => {
        socket.broadcast.emit("new-socket-broadcast", payload);
    });

    socket.on("disconnect-clients", async (payload) => {
        var disconnectCount = parseInt(payload);
        var clients = await io.of("/user").fetchSockets();

        while (connectionCount >= disconnectCount) {
            clients[0].disconnect(true);
            clients = await io.of("/user").fetchSockets();
        }
        socket.emit("disconnect-complete", connectionCount);
    });
});



// last-seen
// client sends update to "last-seen"
// server receives that update, and sends it outbound on a "last-seen-subscribe" namespace
io.of("/last-seen").on("connection", (socket) => {

    socket.on("connect-event", (payload) => {
        payload["socket-url"] = `http://${serverAddress}:${socketPort}`;
        socket.broadcast.emit("connection-subscribe", payload);
    });

});

io.of("/sessions").on("connection", (socket) => {

    // user -> socket -> session. Route the message to the session's service
    socket.on("message-in", (payload) => {
        
        payload['RTT'].push(["server:message-in", Date.now()]);
        socket.broadcast.emit("message-subscribe", payload);
    });

    // session -> socket -> user. Route the payload to the user
    socket.on("message-out", (payload) => {
        const socketId = payload['recipient-socket-id'];
        
        payload['RTT'].push(["server:message-out", Date.now()]);
        io.of("/sessions").to(socketId).emit("message-response", payload);
    });

});

io.of("/message-queue").on("connection", (socket) => {

    console.log("MESSAGE QUEUE CONNECTION " + socket.id);

    // user -> socket -> message queue. 
    socket.on("message-in", (payload) => {
        payload['RTT'].push(["server:message-in", Date.now()]);
        socket.broadcast.emit("message-subscribe", payload);
    });

});

httpServer.listen(socketPort, () =>
  console.log(`server listening at http://localhost:${socketPort}`)
);
