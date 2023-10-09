// sessions service will determine where a user is and route a message to the user
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");
const sessionSocket = io("http://localhost:3000/sessions");
// Route back to the main socket, which will then hand off to the group service client
const groupsSocket = io("http://localhost:8000/groups");

function sendMessage(payload) {
    // query the database to determine where the user is connected
    // send the message to the user

    sessionSocket.emit("message-out", payload);
}


socket.on("connect", () => {
    console.log(socket.id);
});

sessionSocket.on("connect", () => {
    console.log(sessionSocket.id);
});

groupsSocket.on("connect", () => {
    console.log(groupsSocket.id);
});

sessionSocket.on("connection-subscribe", (args) => {
    // When a user first connects, we write to Redis what socket they are connected to

});

sessionSocket.on("message-subscribe", (args) => {
    // write message to message DB
    // if the message is for a group, get the ids of the group members
    
    if (args["type"] == "group") {
        groupsSocket.emit("groups-query", args['group_id']);
    }
    else {
        sendMessage(args);
    }
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