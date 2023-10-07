const { Server } = require("socket.io");

const io = new Server(3000, {});
const sessionSocket = io.of("/session");
const lastSeenSocket = io.of("/last-seen");



io.on("connection", (socket) => {
    console.log(socket.id);
});

io.of("/session").on("connection", (socket) => {
    console.log("connected to the session socket");
});

io.of("/last-seen").on("connection", (socket) => {
    console.log("Last seen at: <insert time>");
});