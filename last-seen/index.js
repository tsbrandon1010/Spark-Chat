// A user will connect to the service, or initiate an event that will emit a "last-seen" event on the "/last-seen" namespace

const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");
const lastSeenSocket = io("http://localhost:3000/last-seen")

socket.on("connect", () => {
    console.log(socket.id);

});

lastSeenSocket.on("connect", () => {
    console.log(lastSeenSocket.id);

});

lastSeenSocket.on("last-seen-subscribe", (args) => {
    console.log(args, " written to the database!")

});