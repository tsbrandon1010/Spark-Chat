// A user will connect to the service, or initiate an event that will emit a "last-seen" event on the "/last-seen" namespace

const { io } = require("socket.io-client");

const listener = io("http://localhost:3000");

listener.on("connect", () => {
    console.log(listener.id);
});

listener.onAny("*", (data) => {
    console.log(data);
    console.log("saw someone!")
});