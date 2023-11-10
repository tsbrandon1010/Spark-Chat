// sessions service will determine where a user is and route a message to the user
const { io } = require("socket.io-client");
const { createClient } = require("redis");
const { v4: uuidv4 } = require("uuid");

const groupsSocket = io("http://localhost:8000/groups");
const sockets = {
    "http://localhost:3000": {
        socket: io("http://localhost:3000", {
            autoConnect: false
        }),
        sessionSocket: io("http://localhost:3000/sessions", {
            autoConnect: false
        })
    },
    "http://localhost:3001" : {
        socket: io("http://localhost:3001", {
            autoConnect: false
        }),
        sessionSocket: io("http://localhost:3001/sessions", {
            autoConnect: false
        })
    }
};


const redisClient = createClient({
    url: 'redis://:ydvzSWmuDNPy@localhost:6379'
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

async function sendMessage(payload, sockets) {
    // query the database to determine where the user is connected
    // send the message to the user

    await cacheMessage(payload);
    
    try {
        const recipientConnection = await retrieveConnection(payload['recipient-user-id']);
    
        // will need this to route to the proper socket, but for now we ignore
        const recipientSocketUrl = recipientConnection["socket-url"];
        const recipientSocketId = recipientConnection["socket-id"];
    
        payload["recipient-socket-id"] = recipientSocketId;
        sockets[recipientSocketUrl]["sessionSocket"].emit("message-out", payload);
    }
    catch (error) {
        
    }
}

async function createConnection(socketId, socketConfig) {
    const socket = socketConfig[socketId]["socket"];
    const sessionSocket = socketConfig[socketId]["sessionSocket"];

    socket.connect();
    sessionSocket.connect();
    
    console.log(`Started sessions service on port: ${socketId}`);
    try {
        await redisClient.connect();
    } catch (error) {
    }
    
    socket.on("connect", () => {
    });

    sessionSocket.on("connect", () => {
    });

    groupsSocket.on("connect", () => {
    });

    sessionSocket.on("message-subscribe", async (payload) => {
        // write message to message DB
        // if the message is for a group, get the ids of the group members
       
        await sendMessage(payload, socketConfig);
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

createConnection("http://localhost:3000", sockets);
createConnection("http://localhost:3001", sockets);