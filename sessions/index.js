// sessions service will determine where a user is and route a message to the user

const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");
const sessionSocket = io("http://localhost:3000/sessions");

// Route back to the main socket, which will then hand off to the group service client
const groupSocket = io("http://localhost:8000/group");

socket.on("connect", () => {
    console.log(socket.id);
});

sessionSocket.on("connect", () => {
    console.log(sessionSocket.id);
});

sessionSocket.on("connection-subscribe", (args) => {
    // When a user first connects, we write to Redis what socket they are connected to

});

sessionSocket.on("message-subscribe", (args) => {
    // write message to message DB
    // determine which socket the user is connected to (read from Redis)
    // if the user is connected, we send the message
    // if the user is not connected, we: ...

    sessionSocket.emit("message-out", {payload : null})

});

