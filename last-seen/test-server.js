const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {

});

// generic connection event for the main namespace
io.on("connection", (socket) => {
    console.log(socket.id + " connected");

    socket.on("message", (arg) => {
        console.log("event " + arg);
    });

    socket.on("last-seen", (args) => {
        console.log(args, " written to the database!")
    
    });

});

// connection event for the last-seen namespace

// client sends update to "last-seen"
// server receives that update, and sends it outbound on a "last-seen-subscribe" namespace
io.of("/last-seen").on("connection", (socket) => {
    console.log(socket.id + " on last-seen namespace");

    socket.on("last-seen", (arg) => {
        io.of("/last-seen").emit("last-seen-subscribe", (arg))
    });

});


httpServer.listen(3000, () =>
  console.log(`server listening at http://localhost:3000`)
);