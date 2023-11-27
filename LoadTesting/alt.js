const { io } = require("socket.io-client");
const fs = require("fs");
const customParse = require("socket.io-msgpack-parser");

const MAX_CLIENTS = parseInt(process.argv[2]);
const CLIENT_CREATION_INTERVAL_IN_MS = 100;
const EMIT_INTERVAL_IN_MS = 1000;

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

    const socketUrl = "http://localhost:3030";
    console.log(socketUrl);
    const socket = io(socketUrl, {parser: customParse});
    const sessionsSocket = io(`${socketUrl}/sessions`, {autoConnect: false, parser: customParse});
    const lastSeenSocket = io(`${socketUrl}/last-seen`, {autoConnect: false, parser: customParse});

 
    const userId = `user_${id}`
    console.log(userId);
    socket.connect();
    sessionsSocket.connect();
    lastSeenSocket.connect();


    lastSeenSocket.on("connect", () => {
        const payload = {
            "user-id": userId, 
            "socket-url": socketUrl, 
            "socket-id": sessionsSocket.id
        }
    
        lastSeenSocket.emit("connect-event", payload);
    });

    sessionsSocket.on("message-response", (message) => {
        message['content'].push(["client:message-response", Date.now()]);
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