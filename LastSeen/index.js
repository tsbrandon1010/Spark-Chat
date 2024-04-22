// A user will connect to the service, or initiate an event that will emit a "last-seen" event on the "/last-seen" namespace
const { io } = require("socket.io-client");
const { createClient } = require("redis");
const customParse = require("socket.io-msgpack-parser");

const redisClient = createClient({
    url: 'redis://:@redis:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

var sockets = {
    "http://172.20.0.6:3000" : {
        socket: io("http://172.20.0.6:3000", { autoConnect: false, transports: ["websocket"]}), 
        lastSeenSocket: io("http://172.20.0.6:3000/last-seen", {autoConnect: false, transports: ["websocket"]})
    }
};

async function establishUserConnection(payload) {

    const key = `connection:user:id:${payload['user-id']}`;
    const value = JSON.stringify(payload);

    await redisClient.set(key, value);
}



async function createConnection(socketURL) {
    const socket = sockets[socketURL]["socket"];
    const lastSeenSocket = sockets[socketURL]["lastSeenSocket"];
    
    socket.connect();
    lastSeenSocket.connect()
    
    console.log(`Started last-seen service on port: ${socketURL}`)
    
    try {
        await redisClient.connect();
    } catch (error) {
    }

    socket.on("connect", () => {
    });
    

    socket.on("new-socket-broadcast", (payload) => {
        sockets[payload['socket-url']] = {
            socket: io(payload['socket-url'], { autoConnect: false, parser: customParse}),
            lastSeenSocket: io(`${payload['socket-url']}/last-seen`, { autoConnect: false, parser: customParse})
        };

        createConnection(payload['socket-url']);
    });

    lastSeenSocket.on("connect", () => {
    });
    
    lastSeenSocket.on("connection-subscribe", async (payload) => {
        // When a user first connects, we write to Redis what socket they are connected to        
        await establishUserConnection(payload);

    });

}


for (const [key, value] of Object.entries(sockets)) {
    createConnection(key);
}