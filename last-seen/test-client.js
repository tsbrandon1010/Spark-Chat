const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");
const lastSeenSocket = io("http://localhost:3000/last-seen")

socket.on("connect", () => {
    console.log(socket.id);

});

lastSeenSocket.on("connect", () => {
    console.log(lastSeenSocket.id);
    
    lastSeenSocket.emit("last-seen", "at a given time");
});

