const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("connected to the websocket as a client");
});

socket.on("disconnect", () => {
    console.log("Disconnected as client");
});

