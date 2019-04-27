
class Handler {
    constructor(username, endpoint, handler) {
        this.username = username;
        var self = this;
        this.ws = new WebSocket('ws://' + window.location.host + endpoint);
        this.ws.addEventListener('message', handler);


        this.keepAlive()

    }

    gravatarURL(email) {
        return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
    }

    keepAlive() {
        console.log("pinging");
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify({
                username: "ping"
            }))
        } else {
            console.log("was not ready, was: ", this.ws.readyState)
        }
        setTimeout(this.keepAlive, 15000);
    }

}
class UserHandler extends Handler {
    constructor(username) {
        let handler = function (e) {
            var msg = JSON.parse(e.data);
            self.others = msg;

        };
        super(username, '/ws', handler);
        this.others = [];
        this.keepAlive()

    }

    send(x, y, z, theta) {
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
                }
            ));
    }
}

class ChatHandler extends Handler{
    constructor(username) {
        let handler = function (e) {
            var msg = JSON.parse(e.data);
            if (self.messages.length === 5) {
                self.messages.shift()
            }
            self.messages.push(msg)

        };
        super(username, '/chat', handler);
        this.messages = [];

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

