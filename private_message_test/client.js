const { io } = require("socket.io-client");

const socketUrl = "http://localhost:3000";
const socket = io(socketUrl);


socket.on("message", (payload) => {
    console.log(payload);
});