package main

import (
	"github.com/gorilla/websocket"
	"github.com/lib/pq"

	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

var userClients = make(map[*websocket.Conn]bool) // connected clients
var chatClients = make(map[*websocket.Conn]bool) // connected clients
var messageBroadcast = make(chan Message)           // broadcast channel
var userBroadcast = make(chan User)           // broadcast channel
var users Users;

func openDb() *sql.DB {
    url := os.Getenv("DATABASE_URL")
    connection, _ := pq.ParseURL(url)
    connection += " sslmode=require"

    db, err := sql.Open("postgres", connection)
    if err != nil {
        log.Println(err)
    }

    return db
}

// Configure the upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	HandshakeTimeout: time.Hour * 1000, //TODO this is really dumb.
}

// Define our message object
type User struct {
	Username string `json:"username"`
	X  float32 `json:"x"`
	Y  float32 `json:"y"`
	Z  float32 `json:"z"`
	Theta  float32 `json:"theta"`
}

type Users struct {
	*sync.Mutex
	Users map[string]User
	SocketMap map[*websocket.Conn]string
}
type Message struct {
	Username string `json:"username"`
	Message string `json:"message"`
}
func main() {

	users.Users = make(map[string]User)
	users.SocketMap = make(map[*websocket.Conn]string)
	users.Mutex = &sync.Mutex{}
	//db := openDb()
	//if err := db.Ping(); err != nil {
	//	panic("should be able to ping db!")
	//}
	// Create a simple file server
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// Configure websocket route
	http.HandleFunc("/ws", handleUserUpdate)
	http.HandleFunc("/chat", handleChat)

	// Start listening for incoming chat messages
	go handleMessages()
	// Start listening for incoming user updates
	go handleUsers()

	// Start the server on localhost port 8000 and log any errors
	log.Println("http server started on :8000")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	err := http.ListenAndServe(fmt.Sprintf(":%v", port), nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleUserUpdate(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	// Register our new client
	userClients[ws] = true

	for {
		var user User
		// Read in a new message as JSON and map it to a Message object
		ws.SetPingHandler(func(appData string) error {return nil})
		err := ws.ReadJSON(&user)
		if err != nil {
			log.Printf("error: %v", err)
			delete(userClients, ws)
			if val, ok := users.SocketMap[ws]; ok {
				users.Mutex.Lock()
				delete(users.Users, val)
				delete(users.SocketMap, ws)
				users.Mutex.Unlock()
			}
			delete(userClients, ws)
			break
		}
		if user.Username == "ping" {
			continue
		}
		users.Mutex.Lock()
		users.SocketMap[ws] = user.Username;
		users.Mutex.Unlock()

		// Send the newly received message to the broadcast channel
		userBroadcast <- user
	}
}

func handleUsers() {
	for {
		// Grab the next message from the broadcast channel
		user := <-userBroadcast
		if user.Username == "" {
			continue
		}
		users.Mutex.Lock()
		users.Users[user.Username] = user;
		users.Mutex.Unlock()
		// Send it out to every client that is currently connected
		for client := range userClients {
			err := client.WriteJSON(users.Users)
			if err != nil {
				log.Printf("user error: %v", err)
				client.Close()
				delete(userClients, client)
			}
		}
	}
}

func handleChat(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	// Register our new client
	chatClients[ws] = true

	for {
		var msg Message
		// Read in a new message as JSON and map it to a Message object
		ws.SetPingHandler(func(appData string) error {return nil})
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("chat error: %v", err)
			delete(chatClients, ws)
			break
		}
		if msg.Username == "ping" {
			continue
		}
		// Send the newly received message to the broadcast channel
		messageBroadcast <- msg
	}
}

func handleMessages() {
	for {
		// Grab the next message from the broadcast channel
		msg := <-messageBroadcast
		if msg.Username == "" {
			continue
		}
		// Send it out to every client that is currently connected
		for client := range chatClients {
			fmt.Println("msg was: ", msg)
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(chatClients, client)
			}
		}
	}
}
