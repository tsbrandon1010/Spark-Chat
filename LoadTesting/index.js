const { io } = require("socket.io-client");
const fs = require("fs");
const customParse = require("socket.io-msgpack-parser");

const writeStream = fs.createWriteStream("new_engine_messageRTT.csv", {"flags" : "a"});
writeStream.write("\n");

const URL = "http://localhost:3000";
const MAX_CLIENTS = process.argv[2];
const CLIENT_CREATION_INTERVAL_IN_MS = 100;
const EMIT_INTERVAL_IN_MS = 2000;

let clientCount = 0;
let disconnectCount = 0;

function sendMessage(userId, recipientUserId, sessionsSocket) {
    const payload = {
        "sender-user-id" : userId,
        "recipient-user-id" : recipientUserId,
        "content" : [['client:message-in', Date.now()]]
    };
    sessionsSocket.emit("message-in", payload);
}


const createClient = (id) => {
    const socket = io(URL, {parser: customParse});
    const userId = `user_${id}`
    const sessionsSocket = io(`${URL}/sessions`, {parser: customParse});
    const lastSeenSocket = io(`${URL}/last-seen`, {parser: customParse});

    lastSeenSocket.on("connect", () => {
        const payload = {
            "user-id": userId, 
            "socket-url": URL, 
            "socket-id": sessionsSocket.id
        }
    
        lastSeenSocket.emit("connect-event", payload);
    });

    sessionsSocket.on("message-response", (message) => {
        message['content'].push(["client:message-response", Date.now()]);
        writeStream.write(`${message['content']}\n`);
    });


    setInterval(() => {
        if (clientCount >= MAX_CLIENTS) {
            messageOutTime = new Date().getTime();
            sendMessage(userId, userId, sessionsSocket);  
        }
    }, EMIT_INTERVAL_IN_MS );
    
    socket.on("disconnect", (reason) => {
        disconnectCount++;
    });

    if (++clientCount < MAX_CLIENTS) {
        setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS, clientCount);
    }

};


createClient(clientCount);