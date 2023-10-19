const httpServer = require("http").createServer()
const io = require("socket.io")(httpServer, {

});


io.on("connection", (socket) => {
    console.log(socket.id + " connected");

    socket.on("message", (arg) => {
        console.log("event " + arg);
    });

    socket.on("last-seen", (args) => {
        console.log(args, " written to the database!")
    
    });

});

// last-seen
// client sends update to "last-seen"
// server receives that update, and sends it outbound on a "last-seen-subscribe" namespace
io.of("/last-seen").on("connection", (socket) => {
    console.log(socket.id + " on last-seen namespace");

    socket.on("last-seen", (arg) => {
        socket.broadcast.emit("last-seen-subscribe", (arg))
    });

});

io.of("/sessions").on("connection", (socket) => {

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
    console.log(socket.id);

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