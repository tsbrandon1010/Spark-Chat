/*
    Groups service receives a request from the sessions service
        - asking the groups service which users are in a given group id
    Groups service checks Redis using the group id as a key and gets the group memebers
    Groups service sends the group members back to the sessions service 
*/

const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");
const groupsSocket = io("http://localhost:3000/groups")

socket.on("connect", () => {
    console.log(socket.id);

});

groupsSocket.on("connect", () => {
    console.log(groupSocket.id);

});

groupsSocket.on("groups-subscribe", (payload) => {
    // check the database for instances of the group 

    // need to define a response payload format
    response = {}
    groupsSocket.emit("groups-result", response)

});