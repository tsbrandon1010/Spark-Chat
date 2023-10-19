// A user will connect to the service, or initiate an event that will emit a "last-seen" event on the "/last-seen" namespace
const { io } = require("socket.io-client");
const { createClient } = require("redis");

const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@localhost:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

const socket = io("http://localhost:3000");
const lastSeenSocket = io("http://localhost:3000/last-seen");

async function getLastSeen(payload) {
    const key = `last-seen:user:${payload['user-id']}`;
    const value = await redisClient.get(key);

    return value;
}

async function writeLastSeen(payload) {
    const key = `last-seen:user:${payload['user-id']}`;
    const value = payload['timestamp'];
    
    redisClient.set(key, value);
}

async function main() {
    await redisClient.connect();

    socket.on("connect", () => {
        console.log(socket.id);
    
    });
    
    lastSeenSocket.on("connect", () => {
        console.log(lastSeenSocket.id);
    
    });
    
    lastSeenSocket.on("last-seen-subscribe", async (args) => {
        await writeLastSeen(args);
    });

}

main()