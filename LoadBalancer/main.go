package main

import (
	"log"
	"net/http"
	"sync"
)

type Server struct {
	URL string
	Connections int
	Mux sync.RWMutex
}


// Return the server with the least amount of users connected
func getNextServer(servers []*Server) (*Server) {

	minServer := servers[0]
	for _, server := range servers {
		if server.Connections < minServer.Connections {
			minServer = server
		}
	}

	return minServer
}

func redirectToSocket(w http.ResponseWriter, r *http.Request) {
	log.Println("here my bro")
	http.Redirect(w, r, "http://localhost:3000", http.StatusSeeOther)
}


// check every server's client count based on a set period
// - at a given time interval
// first, we update the client count
// next, if the client count reaches a certain number, we "spin" up an additional server
func main() {

	/*
	mainServer := &Server{
		URL: "http://localhost:3000",
		Connections: 0,
	} */

	//servers := [] *Server{mainServer}

	mux := http.NewServeMux()
	mux.HandleFunc("/", redirectToSocket)
	http.ListenAndServe(":3030", mux)
}