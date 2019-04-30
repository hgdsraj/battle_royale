window.onload = function init() {
    setupLogin();
};

function setupLogin() {
    document.getElementById('login-form').hidden = true;
    beginGame('veryRealUsername' + Math.floor(Math.random().toString()*1000))

    const loginButton = document.getElementById('login-submit');
    const chatButton = document.getElementById('chat-submit');

    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        loginButton.click();
    });
    document.getElementById('chat-form').addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        chatButton.click();
    });

    function loginClick(e) {
        e.preventDefault();
        username = document.getElementById('username').value;
        if (username === '' || username === 'ping') {
            alert("Username cannot be ping or empty");
            return
        }
        document.getElementById('login-form').hidden = true;
        loginButton.removeEventListener('click', loginClick);

        beginGame(username)
    }

    loginButton.addEventListener('click', loginClick)

}
let domElement;

function setupCameraAndControls() {
    let scene = new THREE.Scene();
    document.getElementById('pause-menu').toggleAttribute('hidden');

    let renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0x000000);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = "main-canvas";

    document.body.appendChild(renderer.domElement);
    domElement = document.getElementById("main-canvas");

    const camera = new THREE.PerspectiveCamera(
        90,                                   // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1,                                  // Near clipping pane
        12000                                  // Far clipping pane
    );
    camera.position.set(0, 100, 200);

    camera.lookAt(new THREE.Vector3(0, 15, 0));
    const controls = new THREE.FirstPersonControls(camera, domElement);


    controls.movementSpeed = 500;
    controls.lookSpeed = 0.2;
    controls.lookVertical = true;
    controls.activeLook = false;
    controls.constrainVertical = true;
    controls.moveUp = false;
    controls.moveDown = false;
    return {'scene': scene, 'camera': camera, 'controls': controls, 'renderer': renderer}
}


function beginGame(username) {
    const chatHandler = new ChatHandler(username);
    const userHandler = new UserHandler(username);
    let theta = 0;
    const sceneControlsCamera = setupCameraAndControls();
    console.log(sceneControlsCamera)
    const scene = sceneControlsCamera['scene'];
    const camera = sceneControlsCamera['camera'];
    const controls = sceneControlsCamera['controls'];
    const renderer = sceneControlsCamera['renderer'];
    var vector = new THREE.Vector3();
    const map = setupMap(scene);
    let collidableMeshList = map['collidableMeshList'];
    let mapDynamics = map['mapDynamics'];
    let shooting = false;
    let lineOfSight = [];

    userCharacter = new Character(username, noFace = true);
    userCharacter.position.set(30, 15, 40);
    scene.add(userCharacter);
    let box = new THREE.Box3().setFromObject(userCharacter);
    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;

    renderer.render(scene, camera);


    let clock = new THREE.Clock();
    let enemies = {};
    let collidableEnemies = []; // holds meshes of enemies for collisions

    let infoMessages = new InfoMessages();
    function handleEnemies() {
        userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, {});
        collidableEnemies = [];
        let usersSeen = {};
        let othersKeys = Object.keys(userHandler.others);
        for (let i = 0; i < othersKeys.length; i++) {
            enemy = userHandler.others[othersKeys[i]];
            if (enemy.username === username) {
                continue
            }
            // todo: terrible way to recieve damage. others can max this value.
            if (username in enemy.attack) {
                console.log(enemy.attack);
                death = userCharacter.receiveDamage(enemy.attack[username]);
                console.log(userCharacter.health);
                if (death) {
                    console.log('death');
                    infoMessages.push(username, enemy.username, 'killed by', '');
                    userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, {},  enemy.username);
                }
            }
            if (enemy.killed_by !== '') {
                infoMessages.push(enemy.username, enemy.killed_by, 'killed by', '');
            }
            if (!(enemy.username in enemies)) {
                enemies[enemy.username] = new Character(enemy.username);
                scene.add(enemies[enemy.username]);
                infoMessages.push(enemy.username, '', 'has entered the game', '');
            }
            enemies[enemy.username].position.set(enemy.x, enemy.y, enemy.z);
            enemies[enemy.username].rotation.y = enemy.theta;
            enemies[enemy.username].healthBar.scale.x = enemy.health;
            enemies[enemy.username].health = enemy.health;
             // = userCharacter.rotation;
            enemyUsername = enemies[enemy.username].rotateUserInfo(theta);
            usersSeen[enemy.username] = true;
        }
        let enemyKeys = Object.keys(enemies);
        for (let i = 0; i < enemyKeys.length; i++) {
            if (!(enemyKeys[i] in usersSeen)) {
                infoMessages.push(enemy.username, '', 'has left the game', '');

                scene.remove(enemies[enemyKeys[i]]);
                delete enemies[enemyKeys[i]]
            } else {
                collidableEnemies = collidableEnemies.concat(calculateCollisionPoints(enemies[enemyKeys[i]]));
            }
        }
        setTimeout(handleEnemies, 20);
    }

    handleEnemies();

    function handleMessages() {
        let txt = '';
        for (let i = 0; i < chatHandler.messages.length; i++) {
            if (chatHandler.messages[i].username === username) {
                txt += `<span class="player-username">` + chatHandler.messages[i].username + `:</span>  ` + chatHandler.messages[i].message + `<br>`;
            } else {
                txt += `<span class="username">` + chatHandler.messages[i].username + `:</span>  ` + chatHandler.messages[i].message + `<br>`;
            }
        }
        document.getElementById('chat-messages').innerHTML = txt;
        setTimeout(handleMessages, 20);
    }

    handleMessages();

    function handleInfos() {
        let txt = '';
        infoMessages.messages.forEach((i) =>  {
            txt += i.message + `<br>`;
        });
        document.getElementById('info-messages').innerHTML = txt;
        setTimeout(handleInfos, 20);
    }

    handleInfos();
    function handleHealth() {
        document.getElementById('health').innerHTML = userCharacter.health * 100;
        setTimeout(handleHealth, 10);
    }

    handleHealth();
    // TODO: terrible way to handle shooting - timing will be messed up...
    function handleShooting() {
        if (shooting === true) {
            lineOfSight.forEach((enemy) => {
                const key = enemy.object.parent.username;
                const attack = {};
                attack[key] = 0.1;
                console.log(attack);
                const death = userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health,attack );
                if (death) {
                    infoMessages.push(username, enemy.object.parent.username, 'has killed', '');
                }
            })
        }
        setTimeout(handleShooting, 10);
    }

    handleShooting();

    window.addEventListener('mouseup', (e) => {
        shooting = false;
    }, false);
    window.addEventListener('mousedown', (e) => {
        if (controls.enabled) {
            shooting = true;
        }
    }, false);

    window.addEventListener('keydown', function (event) {
        if (event.key === 'p') {

            let pauseMenu = document.getElementById('pause-menu');
            pauseMenu.toggleAttribute('hidden')
            if (pauseMenu.hidden === true) {
                domElement.requestPointerLock();
                console.log("Requested");
                controls.enabled = true;
            } else {
                console.log("exit1")
                document.exitPointerLock();
                controls.enabled = false;

            }
        } else if (event.key === 'Enter') {
            let pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu.hidden === false) {
                return
            }
            chatWrapper = document.getElementById('chat-form-wrapper');
            chatWrapper.toggleAttribute('hidden');
            const chatInput = document.getElementById('message');

            // if  hidden (after toggle), then blur, else focus on the input
            if (chatWrapper.hidden === true) {
                domElement.requestPointerLock();
                controls.enabled = true;

                chatInput.blur();
                if (chatInput.value === '' || chatInput.value.length > 120) {
                    alert("Must input a message of length 1 to 120.")
                    return
                }
                chatHandler.send(chatInput.value)
            } else {
                controls.enabled = false;

                chatInput.value = '';
                chatInput.focus();
                document.exitPointerLock();

            }


        }
    });
    console.log(collidableMeshList)
    console.log(userCharacter)
    function loop() {
        controls.update(clock.getDelta());

        const collisionBoundsOfCharacter = userCharacter.children[0].clone();
        collisionBoundsOfCharacter.matrix = userCharacter.matrix;
        collisionBoundsOfCharacter.position.add(userCharacter.position);
        const collisions = detectCollisions(collisionBoundsOfCharacter,  collidableMeshList.concat(collidableEnemies));
        if (collisions.length !== 0) {
            controls.undoMovement();
            controls.dontAllowMovement(collisions[0][1]);
        } else {
            controls.allowAllMovements();
        }
        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x, vector.z);
        lineOfSight = detectBullets(camera.position, vector, collidableEnemies);
        if (lineOfSight.length > 0 && shooting) {
            // console.log(lineOfSight)
        }
        userCharacter.rotation.y = theta;
        userCharacter.position.x = camera.position.x;
        userCharacter.position.z = camera.position.z;
        userCharacter.position.y = camera.position.y - 37;
        mapDynamics();
        // moveNPCs();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }

    loop();
}


