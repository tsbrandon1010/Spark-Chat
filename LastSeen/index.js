// A user will connect to the service, or initiate an event that will emit a "last-seen" event on the "/last-seen" namespace
const { io } = require("socket.io-client");
const { createClient } = require("redis");
const customParse = require("socket.io-msgpack-parser");

const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@localhost:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

const sockets = {
    "http://localhost:3000": {
        socket: io("http://localhost:3000", {
            autoConnect: false,
            parser: customParse
        }),
        lastSeenSocket: io("http://localhost:3000/last-seen", {
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
        })
    }
};

async function establishUserConnection(payload) {

    const key = `connection:user:id:${payload['user-id']}`;
    const value = JSON.stringify(payload);

    await redisClient.set(key, value);
}



async function createConnection(socketId, socketConfig) {
    const socket = socketConfig[socketId]["socket"];
    const lastSeenSocket = socketConfig[socketId]["lastSeenSocket"];
    
    socket.connect();
    lastSeenSocket.connect()
    
    console.log(`Started last-seen service on port: ${socketId}`)
    
    try {
        await redisClient.connect();
    } catch (error) {
    }

    socket.on("connect", () => {
    });
    
    lastSeenSocket.on("connect", () => {
    });
    
    lastSeenSocket.on("connection-subscribe", async (payload) => {
        // When a user first connects, we write to Redis what socket they are connected to        
        await establishUserConnection(payload);

    });

}

createConnection("http://localhost:3000", sockets);
createConnection("http://localhost:3001", sockets);