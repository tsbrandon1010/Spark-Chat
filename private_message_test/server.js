const httpServer = require("http").createServer()
const io = require("socket.io")(httpServer, {

});


io.on("connection", (socket) => {


    console.log(typeof socket.id);   

    io.to(socket.id).emit("message", "joe");

});

httpServer.listen(3000, () =>
  console.log(`server listening at http://localhost:3000`)
);