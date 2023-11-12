const { io } = require("socket.io-client");
const fs = require("fs");


const writeStream = fs.createWriteStream("500_messageRTT.csv", {"flags" : "a"});
writeStream.write("\n");

const URL = "http://localhost:3000";
const MAX_CLIENTS = process.argv[2];
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


const createClient = (id) => {
    const socket = io(URL);
    const userId = `user_${id}`
    const sessionsSocket = io(`${URL}/sessions`);
    const lastSeenSocket = io(`${URL}/last-seen`);

    let messageOutTime = null;

    lastSeenSocket.on("connect", () => {
        const payload = {
            "user-id": userId, 
            "socket-url": URL, 
            "socket-id": sessionsSocket.id
        }
    
        lastSeenSocket.emit("connect-event", payload);
    });

    sessionsSocket.on("message-response", (message) => {
        let messageInTime = new Date().getTime();
        writeStream.write(`${process.argv[3]}, ${(messageInTime - messageOutTime)}\n`)
    });


    setInterval(() => {
        if (clientCount >= MAX_CLIENTS) {
            messageOutTime = new Date().getTime();
            sendMessage(userId, userId, "hello", sessionsSocket);  
        }
    },  EMIT_INTERVAL_IN_MS);
    
    socket.on("disconnect", (reason) => {
        disconnectCount++;
    });

    if (++clientCount < MAX_CLIENTS) {
        setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS, clientCount);
    }

};


createClient(clientCount);

const printReport = () => {
    const now = new Date().getTime();
    const durationSinceLastReport = (now - lastReport) / 1000;
    const packetsPerSeconds = (
        packetsSinceLastReport / durationSinceLastReport
    ).toFixed(2);


    packetsSinceLastReport = 0;
    lastReport = now;
};

setInterval(printReport, 1);