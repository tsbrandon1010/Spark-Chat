package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

func main() {

	backend, _ := url.Parse("http://localhost:3333")

	handler := func(p *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			log.Println(r.URL)
			r.Host = backend.Host
			w.Header().Set("X-Ben", "Rad")
			p.ServeHTTP(w, r)
		}

	}

	proxy := httputil.NewSingleHostReverseProxy(backend)
	http.HandleFunc("/", handler(proxy))

	//err := http.ListenAndServeTLS(":10443", "certs/cert.pem", "certs/key.unencrypted.pem", nil)

	err := http.ListenAndServe(":3030", nil)

	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error while starting the server: %s\n", err)
		os.Exit(1)
	}

}
