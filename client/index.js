const { io } = require("socket.io-client");

// socketUrl will eventually be assigned to the user by the load balancer
const socketUrl = "http://localhost:3000";
console.log(socketUrl);
const socket = io(socketUrl);
const sessionsSocket = io(`${socketUrl}/sessions`)
const lastSeenSocket = io(`${socketUrl}/last-seen`)

const userId = "tsbrandon1010";

socket.on("connect", () => {
});
sessionsSocket.on("connect", () => {
});



lastSeenSocket.on("connect", () => {
    const payload = {
        "user-id": userId, 
        "socket-url": socketUrl, 
        "socket-id": sessionsSocket.id
    }

    lastSeenSocket.emit("connect-event", payload);
});


sessionsSocket.on("message-response", (message) => {
    console.log(message["content"]);
});

function sendMessage(recipientUserId, message) {
    const payload = {
        "sender-user-id" : userId,
        "recipient-user-id" : recipientUserId,
        "content" : message,
        "timestamp" : Date.now()
    };

    // good idea to eventually add callbacks to confirm message reception
    sessionsSocket.emit("message-in", payload);
}

sendMessage("tsbrandon1010", "hello");
