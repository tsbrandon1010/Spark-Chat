const { io } = require("socket.io-client");

const client = io("http://localhost:3000");

client.on("connect", () => {
    console.log(client.id);

});

client.emit("message", "hello there!");

