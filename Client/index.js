const { io } = require("socket.io-client");
const customParse = require("socket.io-msgpack-parser");

// socketUrl will eventually be assigned to the user by the load balancer
const socketUrl = "http://localhost:3030";
console.log(socketUrl);
const socket = io(socketUrl, {parser: customParse});
const sessionsSocket = io(`${socketUrl}/sessions`, {parser: customParse});
const lastSeenSocket = io(`${socketUrl}/last-seen`, {parser: customParse});
const userNamespace = io(`${socketUrl}/user`, {parser: customParse});
const messageQueueNamespace = io(`${socketUrl}/message-queue`, {parser: customParse});

const userId = "tsbrandon1010";

    socket.on("connect", () => {
    });
    sessionsSocket.on("connect", () => {
    });
    userNamespace.on("connect", () => {
    });


    lastSeenSocket.on("connect", () => {
        const payload = {
            "user-id": userId, 
            "socket-url": "", 
            "socket-id": sessionsSocket.id
        }

        console.log(payload);
        lastSeenSocket.emit("connect-event", payload);
    });


    sessionsSocket.on("message-response", (message) => {
        message['RTT'].push(["client:message-response", Date.now()]);
        console.log(message);
    });

    function sendMessage(recipientUserId, message) {
        const payload = {
            "sender-user-id" : userId,
            "recipient-user-id" : recipientUserId,
            "content" : message,
            "RTT" : [["client:message-in", Date.now()]]
            };

    // good idea to eventually add callbacks to confirm message reception
    messageQueueNamespace.emit("message-in", payload);
}


    readline.question("would you like to send a message? [Y/n]: ", (response) => {
        if (response.toLowerCase() == "y") {
            readline.question("Who would you like to send a message to? ", (recipient) => {
                readline.question("Enter your message: ", (message) => {
                    sendMessage(recipient, message);
                    readline.close();
                });
        
            });
        }
    });
});