const httpServer = require("http").createServer()
const io = require("socket.io")(httpServer, {

});
const socketPort = 3001;

io.on("connection", (socket) => {

});

// last-seen
// client sends update to "last-seen"
// server receives that update, and sends it outbound on a "last-seen-subscribe" namespace
io.of("/last-seen").on("connection", (socket) => {

    socket.on("last-seen", (arg) => {
        socket.broadcast.emit("last-seen-subscribe", (arg))
    });

});

io.of("/sessions").on("connection", (socket) => {

    socket.on("connect-event", (payload) => {
        payload["socket-url"] = `http://localhost:${socketPort}`;
        socket.broadcast.emit("connection-subscribe", payload);
    });


    // user -> socket -> session. Route the message to the session's service
    socket.on("message-in", (payload) => {
        socket.broadcast.emit("message-subscribe", payload);
    });

    // session -> socket -> user. Route the payload to the user
    socket.on("message-out", (payload) => {
        const socketId = payload['recipient-socket-id'];
        io.of("/sessions").to(socketId).emit("message-response", payload);
    });

});

io.of("/groups").on("connection", (socket) => {

    socket.on("groups-query", (payload) => {
        socket.broadcast.emit("groups-subscribe", payload);
    });

    socket.on("groups-result", (payload) => {
        socket.broadcast.emit("groups-response", payload);
    });

});


httpServer.listen(socketPort, () =>
  console.log(`server listening at http://localhost:${socketPort}`)
);
