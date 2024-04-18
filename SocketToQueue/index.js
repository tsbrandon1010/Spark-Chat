const { io } = require("socket.io-client");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");
const customParse = require("socket.io-msgpack-parser");

const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@redis:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

var sockets = {
    "http://172.20.0.6:3000" : {
        socket: io("http://172.20.0.6:3000", { autoConnect: false, parser: customParse}), 
        messageQueueSocket: io("http://172.20.0.6:3000/message-queue", { autoConnect: false, parser: customParse})
    }
};

async function writeToQueue(payload) {

    const key = `message-cache:id${uuidv4()}`;
    const value = JSON.stringify(payload);

    await redisClient.set(key, value);
}

async function createConnection(socketURL) {
    const socket = sockets[socketURL]["socket"];
    const messageQueueSocket = sockets[socketURL]["messageQueueSocket"];
    
    socket.connect();
    messageQueueSocket.connect()
    
    console.log(`Started message queue service on port: ${socketURL}`)
    
    try {
        await redisClient.connect();
    } catch (error) {
    }

    socket.on("connect", () => {
    });
    

    socket.on("new-socket-broadcast", (payload) => {
        sockets[payload['socket-url']] = {
            socket: io(payload['socket-url'], { autoConnect: false, parser: customParse}),
            messageQueueSocket: io(`${payload['socket-url']}/last-seen`, { autoConnect: false, parser: customParse})
        };

        createConnection(payload['socket-url']);
    });

    messageQueueSocket.on("connect", () => {
        console.log("Connected to message queue socket");
    });
    
    messageQueueSocket.on("message-subscribe", async (payload) => {
        console.log(payload);
        await writeToQueue(payload);
    });

}

for (const [key, value] of Object.entries(sockets)) {
    createConnection(key);
}