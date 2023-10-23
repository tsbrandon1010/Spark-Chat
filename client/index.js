const { read } = require("fs");
const { io, connect } = require("socket.io-client");
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});


readline.question("What is your user id? ", input => {
    userId = input;
    // socketUrl will eventually be assigned to the user by the load balancer
    const socketUrl = "http://localhost:3000";
    const socket = io(socketUrl);
    const lastSeenSocket = io("http://localhost:3000/last-seen")
    const sessionsSocket = io("http://localhost:3000/sessions")

    socket.on("connect", () => {

    });

    lastSeenSocket.on("connect", () => {
        
        lastSeenSocket.emit("last-seen", {"user-id": userId, "timestamp": Date.now()});
    });

    sessionsSocket.on("connect", () => {
        const payload = {
            "user-id": userId, 
            "socket-url": socketUrl, 
            "socket-id": sessionsSocket.id
        }

        sessionsSocket.emit("connect-event", payload);
    });

    sessionsSocket.on("message-response", (message) => {
        console.log(message["content"]);
    });

    function sendMessage(recipientUserId, message) {
        const payload = {
            "sender-user-id" : userId,
            "recipient-user-id" : recipientUserId,
            "content" : message,
            "timestamp" : Date.now()
        };
    
        // good idea to eventually add callbacks to confirm message reception
        sessionsSocket.emit("message-in", payload);
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


