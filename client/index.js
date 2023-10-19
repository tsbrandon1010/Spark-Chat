const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");
const lastSeenSocket = io("http://localhost:3000/last-seen")
const sessionsSocket = io("http://localhost:3000/sessions")

const userId = "tsbrandon1010";

socket.on("connect", () => {
    console.log(socket.id);

});

lastSeenSocket.on("connect", () => {
    console.log(lastSeenSocket.id);
    
    lastSeenSocket.emit("last-seen", {"user-id": userId, "timestamp": Date.now()});
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

sendMessage("jensonButton22", "hello world!");