package main

import (
	"log"
	"strconv"

	socketio "github.com/zhouhui8915/go-socket.io-client"
)

type Server struct {
	URL string
	Connections int
}

func createClient(server *Server) {	
	client, err := socketio.NewClient(server.URL, &socketio.Options{})
	if err != nil {
		log.Printf("Error while creating a client: %v", err)
		return
	}

	client.On("connection", func()  {
		client.Emit("client-count-request")
	})

	client.On("client-count", func(msg string) {
		clientCount, err := strconv.Atoi(msg)
		if err != nil {
			clientCount = server.Connections
		}
		server.Connections = clientCount
	})

}

func main() {

	mainServer := &Server{
		URL: "http://localhost:3000",
		Connections: 0,
	}

	servers := [] *Server{mainServer}

	// check every server's client count based on a set period
	// - at a given time interval
	// first, we update the client count
	// next, if the client count reaches a certain number, we "spin" up an additional server

	
}