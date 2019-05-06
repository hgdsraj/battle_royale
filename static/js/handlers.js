class Handler {
    constructor(username, endpoint) {
        this.username = username;
        const self = this;
        this.ws = new WebSocket(`${config.protocol}${window.location.host}${endpoint}`);
        this.keepAlive(this.ws);
    }

    gravatarURL(email) {
        return `http://www.gravatar.com/avatar/${CryptoJS.MD5(email)}`;
    }

    keepAlive(ws) {
        const keepAlive = function (keepAlive) {
            console.log('pinging');
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    username: 'ping',
                }));
            } else if (ws.readyState === ws.CLOSED) {
                console.log('was not ready, was: ', ws.readyState);
                alert('error: websocket has closed');
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
        self.others = {};
        self.kills = [];
        self.attacks = [];
        const handler = function (e) {
            self.others = JSON.parse(e.data);
            const othersKeys = Object.keys(self.others);
            for (let i = 0; i < othersKeys.length; i++) {
                if (self.others[othersKeys[i]].attack.username === username) {
                    self.attacks.push(self.others[othersKeys[i]])
                }
                if (self.others[othersKeys[i]].killed_by !== '') {
                    self.kills.push({
                        'username': self.others[othersKeys[i]].username,
                        'killed_by': self.others[othersKeys[i]].killed_by,
                        'killed_by_uuid': self.others[othersKeys[i]].killed_by_uuid
                    })
                }
            }
        };
        this.ws.addEventListener('message', handler);
    }

    send(x, y, z, theta, health, attack, killer) {
        if (this.ws.readyState !== this.ws.OPEN) {
            console.log('not ready');
            return;
        }
        this.ws.send(JSON.stringify({
            username: this.username,
            x,
            y,
            z,
            theta,
            health,
            attack,
            killed_by: killer,
        }));
    }
}

class ChatHandler extends Handler {
    constructor(username) {
        super(username, '/chat');
        const self = this;
        self.messages = [];
        const handler = function (e) {
            const msg = JSON.parse(e.data);
            if (self.messages.length === 5) {
                self.messages.shift();
            }
            self.messages.push(msg);
        };
        this.ws.addEventListener('message', handler);
    }

    send(message) {
        if (this.ws.readyState !== this.ws.OPEN) {
            console.log('not ready');
            return;
        }
        this.ws.send(JSON.stringify({
            username: this.username,
            message,
        }));
    }
}

class InfoMessage {
    constructor(username, second_username, action, message) {
        this.username = username;
        this.message = '';
        if (username !== '') {
            this.message += `<span class="player-username">${username}</span> `;
        }
        if (action !== '') {
            this.message += `${action} `;
        }
        if (second_username !== '') {
            this.message += `<span class="username">${second_username}</span> `;
        }
        if (message !== '') {
            this.message += `${message} `;
        }
    }
}

class InfoMessages {
    constructor() {
        this.messages = [];
    }

    push(username, second_username, action, message) {
        if (this.messages.length === 5) {
            this.messages.shift();
        }
        this.messages.push(new InfoMessage(username, second_username, action, message));
    }
}
