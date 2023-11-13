const { io } = require("socket.io-client");
const fs = require("fs");
const customParse = require("socket.io-msgpack-parser");

const writeStream = fs.createWriteStream("split_server_messageRTT.csv", {"flags" : "a"});
writeStream.write("\n");


const sockets = {
    "http://localhost:3000": {
        socket: io("http://localhost:3000", {
            autoConnect: false,
            parser: customParse
        }),
        lastSeenSocket: io("http://localhost:3000/last-seen", {
            autoConnect: false,
            parser: customParse
        }),
        sessionsSocket: io("http://localhost:3000/sessions", {
            autoConnect: false,
            parser: customParse
        })
    },
    "http://localhost:3001" : {
        socket: io("http://localhost:3001", {
            autoConnect: false,
            parser: customParse
        }),
        lastSeenSocket: io("http://localhost:3001/last-seen", {
            autoConnect: false,
            parser: customParse
        }),
        sessionsSocket: io("http://localhost:3001/sessions", {
            autoConnect: false,
            parser: customParse
        })
    }
};

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


const createClient = (id, sockets) => {

    // if the id is odd, we go to 3001
    // if the id is even, we go to 3000

    let URL = "";
    if (id % 2 == 0) {
        URL = "http://localhost:3000";
    }
    else {
        URL = "http://localhost:3001";
    }

    console.log(URL);

    const socket = sockets[URL]['socket'];
    const sessionsSocket = sockets[URL]['sessionsSocket'];
    const lastSeenSocket = sockets[URL]['lastSeenSocket'];
    const userId = `user_${id}`

    socket.connect();
    sessionsSocket.connect();
    lastSeenSocket.connect();


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
        setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS, clientCount, sockets);
    }

};


createClient(clientCount, sockets);