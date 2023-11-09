const { io } = require("socket.io-client");

const URL = "http://localhost:3000";
const MAX_CLIENTS = 1000;
const CLIENT_CREATION_INTERVAL_IN_MS = 100;
const EMIT_INTERVAL_IN_MS = 1000;

let clientCount = 0;
let disconnectCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;

function sendMessage(userId, recipientUserId, message, sessionsSocket) {
    const payload = {
        "sender-user-id" : userId,
        "recipient-user-id" : recipientUserId,
        "content" : message,
        "timestamp" : Date.now()
    };

    // good idea to eventually add callbacks to confirm message reception
    sessionsSocket.emit("message-in", payload);
}


const createClient = () => {
    const socket = io(URL);

    const sessionsSocket = io(`${URL}/sessions`);

    sessionsSocket.on("connect", () => {
        const payload = {
            "user-id": socket.id, 
            "socket-url": "http://localhost:3000", 
            "socket-id": sessionsSocket.id
        }
    
        sessionsSocket.emit("connect-event", payload);
    });

    setInterval(() => {
        sendMessage(socket.id, socket.id, "hello", sessionsSocket);
    },  EMIT_INTERVAL_IN_MS);

    sessionsSocket.on("message-response", (message) => {
        packetsSinceLastReport++;
    });

    socket.on("disconnect", (reason) => {
        disconnectCount++;
    });

    if (++clientCount < MAX_CLIENTS) {
        setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
    }

};


createClient();

const printReport = () => {
    const now = new Date().getTime();
    const durationSinceLastReport = (now - lastReport) / 1000;
    const packetsPerSeconds = (
        packetsSinceLastReport / durationSinceLastReport
    ).toFixed(2);

    console.log(
        `client count: ${clientCount} ; average packets received per second: ${packetsPerSeconds}`
    );
    console.log(disconnectCount);

    packetsSinceLastReport = 0;
    lastReport = now;
};

setInterval(printReport, 0);