package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"sync"
	"time"
)

type Server struct {
	URL               *url.URL
	Alive             bool
	Mux               sync.RWMutex
	ActiveConnections int
}

type Config struct {
	HealthCheckInterval string   `json:"healthCheckInterval"`
	Servers             []string `json:"servers"`
	Port                string   `json:"port"`
}

func loadConfig(file string) (Config, error) {
	var config Config

	bytes, err := ioutil.ReadFile(file)
	if err != nil {
		return config, err
	}

	err = json.Unmarshal(bytes, &config)
	if err != nil {
		return config, err
	}

	return config, nil
}

func nextServer(servers []*Server) *Server {
	leastActiveConnections := -1
	leastActiveServer := servers[0]

	for _, server := range servers {
		server.Mux.Lock()
		if (server.ActiveConnections < leastActiveConnections || leastActiveConnections == -1) && server.Alive {
			leastActiveServer = server
		}
		server.Mux.Unlock()
	}
	return leastActiveServer
}

func (s *Server) Proxy() *httputil.ReverseProxy {
	return httputil.NewSingleHostReverseProxy(s.URL)
}

func main() {

	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error loading the config file: %s", err.Error())
	}

	healthCheckInterval, err := time.ParseDuration(config.HealthCheckInterval)
	if err != nil {
		log.Fatalf("Invalid health check interval: %s", err.Error())
	}

	var servers []*Server
	for _, serverUrl := range config.Servers {
		u, _ := url.Parse(serverUrl)
		servers = append(servers, &Server{URL: u})
	}

	for _, server := range servers {
		go func(s *Server) {
			for range time.Tick(healthCheckInterval) {
				res, err := http.Get(s.URL.String())
				if err != nil || res.StatusCode >= 500 {
					s.Alive = false
				} else {
					s.Alive = true
				}
			}
		}(server)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		server := nextServer(servers)
		server.Mux.Lock()
		server.ActiveConnections++
		server.Mux.Unlock()
		server.Proxy().ServeHTTP(w, r)
		log.Println("Sending User to: ", server.URL)
		server.Mux.Lock()
		server.ActiveConnections--
		server.Mux.Unlock()
	})

	log.Println("Starting the load balancer on port ", config.Port)
	err = http.ListenAndServe(config.Port, nil)
	if err != nil {
		log.Fatalf("Error while starting the load balancer: %s\n", err)
	}

}
