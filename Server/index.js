const httpServer = require("http").createServer()
const io = require("socket.io")(httpServer, {

});


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
        socket.broadcast.emit("connection-subscribe", payload);
    });


    // user -> socket -> session. Route the message to the session's service
    socket.on("message-in", (payload) => {
        socket.broadcast.emit("message-subscribe", payload);
    });

    // session -> socket -> user. Route the payload to the user
    // have to figure out how to target a specific user on the socket
    socket.on("message-out", (payload) => {

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


httpServer.listen(3000, () =>
  console.log(`server listening at http://localhost:3000`)
);