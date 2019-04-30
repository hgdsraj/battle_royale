
class Handler {
    constructor(username, endpoint) {
        this.username = username;
        const self = this;
        this.ws = new WebSocket('ws://' + window.location.host + endpoint);
        this.keepAlive(this.ws)

    }

    gravatarURL(email) {
        return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
    }

    keepAlive(ws) {
        const keepAlive = function (keepAlive) {
            console.log("pinging");
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    username: "ping"
                }))
            } else if (ws.readyState === ws.CLOSED) {
                console.log("was not ready, was: ", ws.readyState);
                alert("error: websocket has closed");
            }
            setTimeout(keepAlive, 15000);
        };
        keepAlive(keepAlive);
    }

}
class UserHandler extends Handler {
    constructor(username) {
        super(username, '/ws');
        const self = this;
        self.others = [];
        let handler = function (e) {
            self.others = JSON.parse(e.data);
        };
        this.ws.addEventListener('message', handler);
    }

    send(x, y, z, theta, health, attack, killer) {
        if (this.ws.readyState !== this.ws.OPEN) {
            console.log("not ready");
            return
        }
        this.ws.send(
            JSON.stringify({
                    username: this.username,
                    x: x,
                    y: y,
                    z: z,
                    theta: theta,
                    health: health,
                    attack: attack,
                    killed_by: killer,
                }
            ));
    }
}

class ChatHandler extends Handler{
    constructor(username) {
        super(username, '/chat');
        const self = this;
        self.messages = [];
        let handler = function(e) {
            var msg = JSON.parse(e.data);
            if (self.messages.length === 5) {
                self.messages.shift()
            }
            self.messages.push(msg)
        };
        this.ws.addEventListener('message', handler);
    }

    send(message) {
        if (this.ws.readyState !== this.ws.OPEN) {
            console.log("not ready");
            return
        }
        this.ws.send(
            JSON.stringify({
                    username: this.username,
                    message: message,
                }
            ));
    }
}

class InfoMessage {
    constructor(username, second_username, action, message) {
        this.username = username;
        this.message = ``;
        if (username !== '') {
            this.message += `<span class="player-username">${username}</span> `
        }
        if (action !== '') {
            this.message += `${action} `
        }
        if (second_username !== '') {
            this.message += `<span class="username">${second_username}</span> `
        }
        if (message !== '') {
            this.message += `${message} `
        }
    }
}

class InfoMessages {
    constructor() {
        this.messages = [];
    }

    push(username, second_username, action, message) {
        if (this.messages.length === 5) {
            this.messages.shift()
        }
        this.messages.push(new InfoMessage(username, second_username, action, message))

    }
}
