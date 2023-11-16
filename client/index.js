const { io } = require("socket.io-client");
const customParse = require("socket.io-msgpack-parser");

// socketUrl will eventually be assigned to the user by the load balancer
const socketUrl = "http://localhost:3030";
console.log(socketUrl);
const socket = io(socketUrl, {parser: customParse});
const sessionsSocket = io(`${socketUrl}/sessions`, {parser: customParse})
const lastSeenSocket = io(`${socketUrl}/last-seen`, {parser: customParse})

const userId = "tsbrandon1010";

socket.on("connect", () => {
});
sessionsSocket.on("connect", () => {
});



lastSeenSocket.on("connect", () => {
    const payload = {
        "user-id": userId, 
        "socket-url": "http://localhost:3000", 
        "socket-id": sessionsSocket.id
    }

    console.log(payload);
    lastSeenSocket.emit("connect-event", payload);
});


sessionsSocket.on("message-response", (message) => {
    message['content'].push(["client:message-response", Date.now()]);
    console.log(message["content"]);
});

function sendMessage(recipientUserId) {
    const payload = {
        "sender-user-id" : userId,
        "recipient-user-id" : recipientUserId,
        "content" : [["client:message-in", Date.now()]]
        };

    // good idea to eventually add callbacks to confirm message reception
    sessionsSocket.emit("message-in", payload);
}

sendMessage("tsbrandon1010", "hello");
