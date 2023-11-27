// sessions service will determine where a user is and route a message to the user
const { io } = require("socket.io-client");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");
const customParse = require("socket.io-msgpack-parser");

var sockets = {
    "http://172.20.0.6:3000": {
        socket: io("http://172.20.0.6:3000", { autoConnect: false,parser: customParse }),
        sessionSocket: io("http://172.20.0.6:3000/sessions", {autoConnect: false, parser: customParse})
    }
};


const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@redis:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

async function retrieveConnection(userId) {
    const key = `connection:user:id:${userId}`;
    const userConnection = await redisClient.get(key);

    return JSON.parse(userConnection);
}

// responsible for generating a GUID and caching the message
async function cacheMessage(payload) {

    const key = `message-cache:id:${uuidv4()}`
    const value = JSON.stringify(payload);

    await redisClient.set(key, value);
}

async function sendMessage(payload) {
    // query the database to determine where the user is connected
    // send the message to the user

    await cacheMessage(payload);
    
    try {
        const recipientConnection = await retrieveConnection(payload['recipient-user-id']);

        // will need this to route to the proper socket, but for now we ignore
        const recipientSocketUrl = recipientConnection["socket-url"];
        const recipientSocketId = recipientConnection["socket-id"];
    
        payload["recipient-socket-id"] = recipientSocketId;
        payload['content'].push(['session:message-out', Date.now()]);
        sockets[recipientSocketUrl]["sessionSocket"].emit("message-out", payload);
    }
    catch (error) {
       console.log(error); 
    }
}

async function createConnection(socketId) {
    const socket = sockets[socketId]["socket"];
    const sessionSocket = sockets[socketId]["sessionSocket"];

    socket.connect();
    sessionSocket.connect();
    
    console.log(`Started sessions service on port: ${socketId}`);
    try {
        await redisClient.connect();
    } catch (error) {
    }
    
    socket.on("connect", () => {
    });

    socket.on("new-socket-broadcast", (payload) => {
        sockets[payload['socket-url']] = {
            socket: io(payload['socket-url'], { autoConnect: false, parser: customParse}),
            sessionSocket: io(`${payload['socket-url']}/sessions`, { autoConnect: false, parser: customParse})
        };

        createConnection(payload['socket-url']);
    });

    sessionSocket.on("connect", () => {
    });

    sessionSocket.on("message-subscribe", async (payload) => {
        payload['content'].push(['session:message-subscribe', Date.now()]);
        await sendMessage(payload, sockets);
    });
}

for (const [key, value] of Object.entries(sockets)) {
    createConnection(key);
}