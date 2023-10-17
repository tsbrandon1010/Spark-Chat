# Spark-Chat
 
A web-based chatting application designed to service thousands of users using a microservice architecture.

Senior Project - Semester 1

***DOCUMENTATION:*** [Notion Page](https://regular-denim-565.notion.site/Senior-Project-e173d04cfb98494e8dadd7a123751db5?pvs=4)

## High level architecture:

### 1-1 Messaging: 

![system-design](https://github.com/tsbrandon1010/Spark-Chat/assets/15933213/9f9f6ac8-369d-488e-ab93-fcf7a69bd705)

### Last Seen Service:

Will keep a record in a Redis DB. Everytime a user connects to the application, or does an action like send a message, their last seen status will be updated.

How it works:
- Client connects/does a qualifying action.
- Client (with an already established connection in the ```/last-seen``` namespace) emits a ``last-seen`` message over the namespace.
- The socket receives the ```last-seen``` message in the ```/last-seen``` namespace.
- The message is then routed by the socket to the last-seen service. This is done by the socket emitting a ```last-seen-subscribe``` message over the ```/last-seen``` namespace.
- The last-seen service receives the ```last-seen-subscribe``` message on the ```/last-seen``` namespace and makes an insertion into Redis.

![last-seen-service](https://github.com/tsbrandon1010/Spark-Chat/assets/15933213/5ff3d2fc-9087-4057-a3a1-7c1f7868f96a)

### Group Chat Architecture:

![group-chat-arch](https://github.com/tsbrandon1010/Spark-Chat/assets/15933213/c91ad237-44bd-4124-8ba4-b2d69cb9b0d7)
