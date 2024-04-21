// sessions service will determine where a user is and route a message to the user
const { io } = require("socket.io-client");
const { createClient, commandOptions } = require("redis");
const { v4: uuidv4 } = require("uuid");
const customParse = require("socket.io-msgpack-parser");

var sockets = {
    "http://172.20.0.6:3000": {
        socket: io("http://172.20.0.6:3000", { autoConnect: false,parser: customParse, transports: ["websocket"]}),
        sessionSocket: io("http://172.20.0.6:3000/sessions", {autoConnect: false, parser: customParse, transports: ["websocket"]})
    }
};


const redisClient = createClient({
    url: 'redis://:@redis:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

const subscriber = redisClient.duplicate();
subscriber.on('error', err => console.log('Redis Subscriber Error', err));

async function retrieveConnection(userId) {
    const key = `connection:user:id:${userId}`;
    const userConnection = await redisClient.get(key);

    return JSON.parse(userConnection);
}

async function sendMessage(payload) {
    // query the database to determine where the user is connected
    // send the message to the user
    
    try {
        const recipientConnection = await retrieveConnection(payload['recipient-user-id']);

        // will need this to route to the proper socket, but for now we ignore
        const recipientSocketUrl = recipientConnection["socket-url"];
        const recipientSocketId = recipientConnection["socket-id"];
    
        payload["recipient-socket-id"] = recipientSocketId;
        payload['RTT'].push(['session:message-out', Date.now()]);
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
        payload['RTT'].push(['session:message-subscribe', Date.now()]);
        await sendMessage(payload, sockets);
    });

    try {
        await redisClient.xGroupCreate("message-queue", "subs", "0", {
            MKSTREAM: true
        });
    } catch (e) {}

    while (true) {
        try {
            let response = await redisClient.xReadGroup(
                commandOptions({
                    isolated: true
                }),
                "subs",
                "consumer-1", [
                    {
                        key: "message-queue",
                        id: ">"
                    }
                ], {
                    COUNT: 1,
                    BLOCK: 0
                }
            );

            if (response) {
                let message = JSON.parse(response[0].messages[0]["message"]["streamKey"]);
                await redisClient.xAck("message-queue", "subs", response[0].messages[0].id)

                await sendMessage(message);
            }
        } catch (err) {
            console.log(err);
        }
    }
}

for (const [key, value] of Object.entries(sockets)) {
    createConnection(key);
}