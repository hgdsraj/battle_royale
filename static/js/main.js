window.onload = function init() {
    setupLogin();
};

function setupLogin() {
    document.getElementById('login-form').hidden = true;
    beginGame('veryRealUsername' + Math.floor(Math.random().toString() * 1000))

    const loginButton = document.getElementById('login-submit');
    const chatButton = document.getElementById('chat-submit');

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        loginButton.click();
    });
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatButton.click();
    });

    function loginClick(e) {
        e.preventDefault();
        username = document.getElementById('username').value;
        if (username === '' || username === 'ping') {
            alert('Username cannot be ping or empty');
            return;
        }
        document.getElementById('login-form').hidden = true;
        loginButton.removeEventListener('click', loginClick);

        beginGame(username);
    }

    loginButton.addEventListener('click', loginClick);
}

let domElement;

function setupCameraAndControls() {
    const scene = new THREE.Scene();
    document.getElementById('pause-menu').toggleAttribute('hidden');

    const renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0x000000);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = 'main-canvas';

    document.body.appendChild(renderer.domElement);
    domElement = document.getElementById('main-canvas');

    const camera = new THREE.PerspectiveCamera(
        90, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping pane
        12000, // Far clipping pane
    );
    camera.position.set(-100, 100, 450);

    camera.lookAt(new THREE.Vector3(0, 15, 0));
    const controls = new THREE.FirstPersonControls(camera, domElement);
    scene.background = new THREE.Color(0x5C646C);
    scene.fog = new THREE.FogExp2( 0x5C646C, 0.0003);

    controls.movementSpeed = 500;
    controls.lookSpeed = 0.2;
    controls.lookVertical = true;
    controls.activeLook = false;
    controls.constrainVertical = true;
    controls.moveUp = false;
    controls.moveDown = false;
    return {
        scene, camera, controls, renderer,
    };
}


function beginGame(username) {
    const chatHandler = new ChatHandler(username);
    const userHandler = new UserHandler(username);
    let theta = 0;
    const sceneControlsCamera = setupCameraAndControls();
    console.log(sceneControlsCamera);
    const scene = sceneControlsCamera.scene;
    const camera = sceneControlsCamera.camera;
    const controls = sceneControlsCamera.controls;
    const renderer = sceneControlsCamera.renderer;
    const vector = new THREE.Vector3();
    const map = setupMap(scene);
    const collidableMeshList = map.collidableMeshList;
    const mapDynamics = map.mapDynamics;
    let shooting = false;
    let lineOfSight = [];
    let killCount = {};
    let attacks =  {};

    userCharacter = new Character(username, noFace = true);
    scene.add(userCharacter);
    const box = new THREE.Box3().setFromObject(userCharacter);
    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;

    renderer.render(scene, camera);


    const clock = new THREE.Clock();
    const enemies = {};
    let collidableEnemies = []; // holds meshes of enemies for collisions
    const kills = {};

    const infoMessages = new InfoMessages();

    function handleEnemies() {
        userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, {});
        collidableEnemies = [];
        const usersSeen = {};
        const othersKeys = Object.keys(userHandler.others);
        for (let i = 0; i < othersKeys.length; i++) {
            const enemy = userHandler.others[othersKeys[i]];
            killCount = enemy.kill_log.kill_count;
            if (enemy.username === username) {
                continue;
            }
            // todo: terrible way to recieve damage. others can max this value.
            if (!(enemy.username in enemies)) {
                enemies[enemy.username] = new Character(enemy.username);
                scene.add(enemies[enemy.username]);
                infoMessages.push(enemy.username, '', 'has entered the game', '');
            }
            enemies[enemy.username].position.set(enemy.x, enemy.y, enemy.z);
            enemies[enemy.username].rotation.y = enemy.theta;
            enemies[enemy.username].healthBar.scale.x = Math.max(enemy.health / 100, 0.0000001);
            enemies[enemy.username].health = enemy.health;
            // = userCharacter.rotation;
            enemyUsername = enemies[enemy.username].rotateUserInfo(theta);
            usersSeen[enemy.username] = true;
        }
        const enemyKeys = Object.keys(enemies);
        for (let i = 0; i < enemyKeys.length; i++) {
            if (!(enemyKeys[i] in usersSeen)) {
                infoMessages.push(enemies[enemyKeys[i]].username, '', 'has left the game', '');

                scene.remove(enemies[enemyKeys[i]]);
                delete enemies[enemyKeys[i]];
            } else {
                collidableEnemies = collidableEnemies.concat(calculateCollisionPoints(enemies[enemyKeys[i]]));
            }
        }
        setTimeout(handleEnemies, 20);
    }

    handleEnemies();

    function handleDamageAndKills() {
        if (userHandler.kills.length > 0) {
            const kill = userHandler.kills.shift();
            if (kill.username !== username) {
                const key = kill.username + kill.killed_by + kill.killed_by_uuid;
                if (!(key in kills)) {
                    infoMessages.push(kill.username, kill.killed_by, 'killed by', '');
                }
                kills[key] = true;
            }
        }
        if (userHandler.attacks.length > 0) {
            const enemy = userHandler.attacks.shift();
            if (!(enemy.attack.uuid in attacks)) {
                death = userCharacter.receiveDamage(enemy.attack.damage);
                if (death) { // TODO missing packets because this is on an interval (can miss a killed by or damage) -- use queue for damage --
                    infoMessages.push(username, enemy.username, 'killed by', '');
                    userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, {}, enemy.username);
                    camera.position.set(-100, 100, 450);
                }
                attacks[enemy.attack.uuid] = true;
            }

        }

        setTimeout(handleDamageAndKills, 1);

    }

    handleDamageAndKills();

    function handleMessages() {
        let txt = '';
        for (let i = 0; i < chatHandler.messages.length; i++) {
            if (chatHandler.messages[i].username === username) {
                txt += `<span class="player-username">${chatHandler.messages[i].username}:</span>  ${chatHandler.messages[i].message}<br>`;
            } else {
                txt += `<span class="username">${chatHandler.messages[i].username}:</span>  ${chatHandler.messages[i].message}<br>`;
            }
        }
        document.getElementById('chat-messages').innerHTML = txt;
        setTimeout(handleMessages, 20);
    }

    handleMessages();

    function handleInfos() {
        let txt = '';
        infoMessages.messages.forEach((i) => {
            txt += `${i.message}<br>`;
        });
        document.getElementById('info-messages').innerHTML = txt;
        setTimeout(handleInfos, 20);
    }

    handleInfos();

    function handleHealth() {
        document.getElementById('health').innerHTML = userCharacter.health;
        setTimeout(handleHealth, 10);
    }

    handleHealth();

    function handleKills() {
        let kills = '';
        const keys = Object.keys(killCount);
        for (let i = 0; i < keys.length; i++) {
            kills += `<tr> <td> ${keys[i]}</td> <td>${killCount[keys[i]]}</td></tr>`;
        }
        document.getElementById('kills').innerHTML = kills;
        setTimeout(handleKills, 10);
    }

    handleKills();
    const bloodSphere = new THREE.Mesh(new THREE.SphereGeometry(3, 52, 52), new THREE.MeshPhongMaterial({
        refractionRatio: 0.1,
        reflectivity: 0.04,
        color: 0xff0000,
    }));

    // TODO: terrible way to handle shooting - timing will be messed up...
    function handleShooting() {
        scene.remove(bloodSphere);
        controls.recoil();
        if (lineOfSight.length > 0 && lineOfSight[0].object.parent.username !== undefined) {
            const enemy = lineOfSight[0];
            point = enemy.point;
            bloodSphere.position.set(point.x, point.y, point.z);

            scene.add(bloodSphere);

            const attack = {'username': enemy.object.parent.username, 'damage': 2};
            userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, attack);
        }

        if (shooting === true) { //  TODO this doesn't work...shooting true when called so stays true
            setTimeout(handleShooting, 100);
        }
    }


    function zoomIn() {
        camera.zoom += 0.1;

        camera.updateProjectionMatrix();
        if (camera.zoom < 1.5) {
            setTimeout(zoomIn, 1);
        }
    }

    function zoomOut() {
        camera.zoom -= 0.1;

        camera.updateProjectionMatrix();
        if (camera.zoom > 1) {
            setTimeout(zoomOut, 1);
        }
    }

    window.addEventListener('mouseup', (e) => {
        if (controls.enabled) {
            if (e.button === 0) {
                shooting = false;
                clearTimeout(handleShooting)
            } else if (e.button === 2) {
                zoomOut();
            }
        }
    }, false);
    window.addEventListener('mousedown', (e) => {
        if (controls.enabled) {
            if (e.button === 0) {
                shooting = true;
                handleShooting();
            } else if (e.button === 2) {
                zoomIn();
            }
        }
    }, false);

    let inChat = false;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'p' && !inChat) {
            const pauseMenu = document.getElementById('pause-menu');
            pauseMenu.toggleAttribute('hidden');
            if (pauseMenu.hidden === true) {
                domElement.requestPointerLock();
                console.log('Requested');
                controls.enabled = true;
            } else {
                console.log('exit1');
                document.exitPointerLock();
                controls.enabled = false;
            }
        } else if (event.key === 'Enter') {
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu.hidden === false) {
                return;
            }
            chatWrapper = document.getElementById('chat-form-wrapper');
            chatWrapper.toggleAttribute('hidden');
            const chatInput = document.getElementById('message');

            // if  hidden (after toggle), then blur, else focus on the input
            if (chatWrapper.hidden === true) {
                inChat = false;
                domElement.requestPointerLock();
                controls.enabled = true;

                chatInput.blur();
                if (chatInput.value === '' || chatInput.value.length > 120) {
                    alert('Must input a message of length 1 to 120.');
                    return;
                }
                chatHandler.send(chatInput.value);
            } else {
                inChat = true;
                controls.enabled = false;

                chatInput.value = '';
                chatInput.focus();
                document.exitPointerLock();
            }
        } else if (event.key === '`') {
            const scoreboard = document.getElementById('scoreboard');
            scoreboard.toggleAttribute('hidden');
            if (scoreboard.hidden === true) {
                document.getElementById('pause-menu').hidden = true;
                domElement.requestPointerLock();
                console.log('Requested');
            }
        }
    });
    console.log(collidableMeshList);
    console.log(userCharacter);
    function moveMapParticles() {
        mapDynamics();
        setTimeout(moveMapParticles, 5)
    }
    moveMapParticles();
    function calculateCollisions() {
        const collisionBoundsOfCharacter = userCharacter.children[0].clone();
        collisionBoundsOfCharacter.matrix = userCharacter.matrix;
        collisionBoundsOfCharacter.position.add(userCharacter.position);
        const collisions = detectCollisions(collisionBoundsOfCharacter, collidableMeshList.concat(collidableEnemies));
        if (collisions.length !== 0) {
            controls.undoMovement();
            controls.dontAllowMovement(collisions[0][1]);
            // console.log(collisions[0][2])
            // const faccia = collisions[0][2].face.normal;
            // if (faccia.x <=-0.9 ){
            //     camera.position.x = camera.position.x -30
            // }
            // if (faccia.x >=0.9 ){
            //     camera.position.x = camera.position.x +30
            // }
            // if (faccia.z <=-0.9 ){
            //     camera.position.z = camera.position.z -30
            // }
            // if (faccia.z >=0.9 ){
            //     camera.position.z = camera.position.z +30
            // }

        } else {
            controls.allowAllMovements();
        }
        lineOfSight = detectBullets(camera.position, vector, collidableMeshList.concat(collidableEnemies));

        setTimeout(calculateCollisions, 1)
    }
    calculateCollisions();


    function loop() {
        controls.update(clock.getDelta());


        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x, vector.z);
        userCharacter.rotation.y = theta;
        userCharacter.position.x = camera.position.x;
        userCharacter.position.z = camera.position.z;
        userCharacter.position.y = camera.position.y - 37;
        // moveNPCs();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }

    loop();
}

