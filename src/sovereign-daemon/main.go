package main

import (
	"fmt"
	"net"
	"net/http"
	"os"
)

var version = "dev"
var bomHash = "none"

func main() {
	fmt.Printf("Sovereign Daemon %s (BOM: %s) starting...\n", version, bomHash)
	if len(os.Args) > 1 && os.Args[1] == "serve" {
		http.HandleFunc("/v1/env/validate", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"valid"}`))
		})
		http.HandleFunc("/v1/pipeline/execute", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"executed"}`))
		})
		http.HandleFunc("/v1/artifact/sign", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"signed"}`))
		})
		http.HandleFunc("/v1/daemon/status", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"running"}`))
		})
		sock := "/run/user/1000/snapkitty.sock"
		for i, arg := range os.Args {
			if arg == "--socket" && i+1 < len(os.Args) {
				sock = os.Args[i+1]
			}
		}
		fmt.Printf("Mock server listening on unix socket: %s\n", sock)
		os.Remove(sock)
		listener, err := net.Listen("unix", sock)
		if err != nil {
			fmt.Printf("Failed to listen: %v\n", err)
			select {} // block forever
		}
		http.Serve(listener, nil)
	} else {
		fmt.Println("Usage: sovereign-daemon serve --socket <path>")
	}
}
