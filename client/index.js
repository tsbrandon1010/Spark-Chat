const { io } = require("socket.io-client");

// socketUrl will eventually be assigned to the user by the load balancer
const socketUrl = "http://localhost:3030";
const socket = io(socketUrl);
const lastSeenSocket = io(`${socketUrl}/last-seen`)
const sessionsSocket = io(`${socketUrl}/sessions`)

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

    sessionsSocket.emit("connect-event", payload);
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


sendMessage("tsbrandon1010", "hello, from jenson!");
