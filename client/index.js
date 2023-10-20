const { io } = require("socket.io-client");

// socketUrl will eventually be assigned to the user by the load balancer
const socketUrl = "http://localhost:3000";
const socket = io(socketUrl);
const lastSeenSocket = io("http://localhost:3000/last-seen")
const sessionsSocket = io("http://localhost:3000/sessions")

const userId = "tsbrandon1010";

socket.on("connect", () => {

});

lastSeenSocket.on("connect", () => {
    
    lastSeenSocket.emit("last-seen", {"user-id": userId, "timestamp": Date.now()});
});

sessionsSocket.on("connect", () => {
    const payload = {
        "user-id": userId, 
        "socket-url": socketUrl, 
        "socket-id": sessionsSocket.id
    }

    console.log("Session socket-id: ", sessionsSocket.id);
    sessionsSocket.emit("connect-event", payload);
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