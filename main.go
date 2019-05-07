package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/lib/pq"
	"github.com/satori/go.uuid"
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
var config Config;

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
type Config struct {
	Protocol string `json:"protocol"`
	Local bool `json:"local"`
}
type attack struct {
	Username string `json:"username"`
	Damage float64 `json:"damage"`
	UUID string `json:"uuid"`
}
// Define our message object
type User struct {
	Username string `json:"username"`
	X  float32 `json:"x"`
	Y  float32 `json:"y"`
	Z  float32 `json:"z"`
	Theta  float32 `json:"theta"`
	Health  float64 `json:"health"`
	Attack attack `json:"attack"`
	Shooting bool `json:"shooting"`
	KilledBy string `json:"killed_by"`
	KilledByUUID string `json:"killed_by_uuid"`
	KillLog killLog `json:"kill_log"`
}

type killLog struct {
	KillCount map[string]int `json:"kill_count"`
	Kills map[string]map[string]int `json:"kills"`
	Damage map[string]float64 `json:"damage"`
}

var globalKillLog = killLog{}
var killLogMutex = &sync.Mutex{}
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
	globalKillLog.KillCount = make(map[string]int)
	globalKillLog.Kills = make(map[string]map[string]int)
	globalKillLog.Damage = make(map[string]float64)
	users.Users = make(map[string]User)
	users.SocketMap = make(map[*websocket.Conn]string)
	users.Mutex = &sync.Mutex{}
	production := os.Getenv("HEROKU");
	if production != "" {
		config.Local = false
		config.Protocol = "wss://"
	} else {
		config.Local = true
		config.Protocol = "ws://"
	}
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
	http.HandleFunc("/config.json", handleConfig)

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
	defer func() {
		err := ws.Close()
		if err != nil {
			log.Fatal(err)
		}
	}()

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
				killLogMutex.Lock()
				delete(globalKillLog.KillCount, val)
				delete(globalKillLog.Kills, val)
				killLogMutex.Unlock()

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
		//fmt.Println(user.Attack)
		// Send the newly received message to the broadcast channel
		killLogMutex.Lock()
		if globalKillLog.Kills[user.Username] == nil {
			globalKillLog.Kills[user.Username] = make(map[string]int)
			globalKillLog.KillCount[user.Username] = 0
			globalKillLog.Damage[user.Username] = 0

		}

		if user.Attack.Username != "" {
			globalKillLog.Damage[user.Username] += user.Attack.Damage
		}

		if user.KilledBy != "" {
			globalKillLog.KillCount[user.KilledBy] += 1
			if _, ok := globalKillLog.Kills[user.KilledBy]; ok {
				globalKillLog.Kills[user.KilledBy][user.Username] += 1
			}

			u := uuid.NewV4()
			user.KilledByUUID = u.String()
		}
		killLogMutex.Unlock()

		user.KillLog = globalKillLog
		if user.Attack.Username != "" {
			user.Attack.UUID = uuid.NewV4().String()
		}
		userBroadcast <- user
	}
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var err error
	bytes, err := json.Marshal(config)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, err := w.Write([]byte(fmt.Sprintf("Error: %v", err)))
		if err != nil {
			log.Printf("error: %v", err);
		}
		return
	}
	_, err = w.Write(bytes)


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
			killLogMutex.Lock()
			err := client.WriteJSON(users.Users)
			killLogMutex.Unlock()

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
