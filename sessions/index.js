// sessions service will determine where a user is and route a message to the user
const { io } = require("socket.io-client");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");
const { platform } = require("os");

const socket = io("http://localhost:3000");
const sessionSocket = io("http://localhost:3000/sessions");
// Route back to the main socket, which will then hand off to the group service client
const groupsSocket = io("http://localhost:8000/groups");

const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@localhost:6379'
});
redisClient.on('error', err => console.log('Redis Client Error', err));

async function associateUser(payload) {

    const key = `connection:user:id:${payload['user-id']}`;
    const value = JSON.stringify(payload);

    await redisClient.set(key, value);
}

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
    console.log(await retrieveConnection(payload['recipient-user-id']));
    sessionSocket.emit("message-out", payload);
}

async function main() {
    await redisClient.connect();
    
    socket.on("connect", () => {
    });

    sessionSocket.on("connect", () => {
    });

    groupsSocket.on("connect", () => {
    });

    sessionSocket.on("connection-subscribe", async (payload) => {
        // When a user first connects, we write to Redis what socket they are connected to        
        await associateUser(payload);

    });

    sessionSocket.on("message-subscribe", async (payload) => {
        // write message to message DB
        // if the message is for a group, get the ids of the group members
       
        await sendMessage(payload);
        /*
        if (payload["type"] == "group") {
            groupsSocket.emit("groups-query", payload['group_id']);
        }
        else {
            sendMessage(payload);
        }
        */
    });

    groupsSocket.on("groups-response", (response) => {
        // then we send the messages to to each member in the group

        // if that group exists
        if (response["response-code"] == "200") {
            for (let i = 0; i < response['group-members'].length; i++) {
                sendMessage(/* Need to include message payload format */);
            }
        }

        // if the group doesn't exist
        // ???
    });
}

main()