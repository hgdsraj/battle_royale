const config = new Config();

window.onload = function init() {
    fetch('./config.json')
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }

                // Examine the text in the response
                response.json().then(function(data) {
                    config.protocol = data.protocol;
                    config.local = data.local;
                    setupLogin();
                });
            }
        )
        .catch(function(err) {
            console.log('Fetch Error :-S', err);
            setupLogin();
        });

};

function setupLogin() {
    if (config.local) {
        document.getElementById('login-form').hidden = true;
        beginGame('veryRealUsername' + Math.floor(Math.random().toString() * 1000))
    }
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

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
        10000, // Far clipping pane
    );
    camera.position.set(-100, 100, 450);

    camera.lookAt(new THREE.Vector3(0, 15, 0));


    const controls = new THREE.FirstPersonControls(camera, domElement);
    scene.background = new THREE.Color(0x5C646C);
    scene.fog = new THREE.FogExp2( 0x5C646C, 0.0005);

    controls.movementSpeed = 250;
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
    let numRecoils = 0;
    const recoilMax = 10;
    const recoilAmount = 0.02;
    const sceneControlsCamera = setupCameraAndControls();
    const scene = sceneControlsCamera.scene;
    const camera = sceneControlsCamera.camera;
    const controls = sceneControlsCamera.controls;
    const renderer = sceneControlsCamera.renderer;
    const vector = new THREE.Vector3();
    const map = setupMap(scene);
    const collidableMeshList = map.collidableMeshList;
    const mapSize = map.mapSize;
    const mapDynamics = map.mapDynamics;
    let shooting = false;
    let lineOfSight = [];
    let killCount = {};
    let damage = {};
    let attacks =  {};
    let shootingTimeout = null;
    let userCharacter = new Character(username, noFace = true, isMainCharcter = true);
    const hitmarkerSelector = document.getElementById("hitmarker-wrapper");
    scene.add(userCharacter);

    const box = new THREE.Box3().setFromObject(userCharacter);
    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;

    renderer.render(scene, camera);

    var listener = new THREE.AudioListener();
    camera.add( listener );
    var audioLoader = new THREE.AudioLoader();

    var shootingSound = new THREE.Audio( listener );
    audioLoader.load( 'audio/gun.mp3', function( buffer ) {
        shootingSound.setBuffer( buffer );
        // sound.setLoop( true );
        shootingSound.setVolume( 0.25 );
        // sound.play();
    });

    var hitmarkerSound = new THREE.Audio( listener );
    audioLoader.load( 'audio/hitmarker.mp3', function( buffer ) {
        hitmarkerSound.setBuffer( buffer );
        // sound.setLoop( true );
        hitmarkerSound.setVolume( 0.5 );
        // sound.play();
    });

    var footstepSound = new THREE.Audio( listener );
    audioLoader.load( 'audio/footstep.wav', function( buffer ) {
        footstepSound.setBuffer( buffer );
        // sound.setLoop( true );
        footstepSound.setVolume( 0.8 );
        // sound.play();
    });
    controls.footstepSound = footstepSound;

    var jumpSound = new THREE.Audio( listener );
    audioLoader.load( 'audio/jump1.wav', function( buffer ) {
        jumpSound.setBuffer( buffer );
        // sound.setLoop( true );
        jumpSound.setVolume( 0.8 );
        // sound.play();
    });
    controls.jumpSound = jumpSound;
    const clock = new THREE.Clock();
    const enemies = {};
    let collidableEnemies = []; // holds meshes of enemies for collisions
    const kills = {};

    const infoMessages = new InfoMessages();
    let hideHitmarkerTimeout;
    function hideHitmarker() {
        hitmarkerSelector.hidden = true;
    }
    function handleEnemies() {
        userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, {});
        collidableEnemies = [];
        const usersSeen = {};
        const othersKeys = Object.keys(userHandler.others);
        for (let i = 0; i < othersKeys.length; i++) {
            const enemy = userHandler.others[othersKeys[i]];
            killCount = enemy.kill_log.kill_count;
            damage = enemy.kill_log.damage;

            if (enemy.username === username) {
                if (damage[username] !== userCharacter.damage) {
                    console.log(damage[username], userCharacter.damage)
                    userCharacter.damage = damage[username];
                    if (hitmarkerSound.isPlaying) {
                        hitmarkerSound.stop();
                    }
                    hitmarkerSound.play();
                    if (hitmarkerSelector.hidden === true) {
                        clearTimeout(hideHitmarkerTimeout);
                        hitmarkerSelector.hidden = false;
                        hideHitmarkerTimeout = setTimeout(hideHitmarker, 500)
                    }


                }
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
            kills += `<tr> <td> ${keys[i]}</td> <td>${killCount[keys[i]]}</td><td>${damage[keys[i]]}</td></tr>`;
        }
        document.getElementById('kills').innerHTML = kills;
        setTimeout(handleKills, 10);
    }

    handleKills();
    // TODO: terrible way to handle shooting - timing will be messed up...
    function handleShooting() {
        if (shootingSound.isPlaying) {
            shootingSound.stop();
        }

        shootingSound.play();
        if (numRecoils < recoilMax) {
            controls.recoil(1,recoilAmount);
            numRecoils += 1;
        } else {
            controls.recoil(1, recoilAmount);
            setTimeout(() => {controls.recoil(1, -recoilAmount)}, 65)
        }
        userCharacter.gun.recoil(65);
        if (lineOfSight.length > 0 && lineOfSight[0].object.parent.username !== undefined) {


            const enemy = lineOfSight[0];
            const point = enemy.point;
            const bloodSphere = new THREE.Mesh(new THREE.SphereGeometry(2, 52, 52), new THREE.MeshPhongMaterial({
                refractionRatio: 0.1,
                reflectivity: 0.04,
                color: 0xff0000,
            }));
            bloodSphere.position.set(point.x, point.y, point.z);

            function removeBloodSphere() {
                scene.remove(bloodSphere)
            }

            scene.add(bloodSphere);
            setTimeout(removeBloodSphere, 500)
            const attack = {'username': enemy.object.parent.username, 'damage': 2};
            userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.health, attack);
        } else if (lineOfSight.length > 0) {
            const collisionObject = lineOfSight[0];
            const point = collisionObject.point;

            const bulletHole = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshMatcapMaterial({
                color: 0x4e555b,
            }));
            bulletHole.position.set(point.x, point.y, point.z);

            function removeBulletHole() {
                scene.remove(bulletHole)
            }

            scene.add(bulletHole);
            setTimeout(removeBulletHole, 10000)
        }

        shootingTimeout = setTimeout(handleShooting, 100);
    }


    let zoomingIn = false;
    let zoomingOut = false;
    let zoomInTimeout;
    let zoomOutTimeout;
    function zoomIn() {
        camera.zoom += 0.1;

        camera.updateProjectionMatrix();
        if (camera.zoom < 1.5) {
            zoomInTimeout = setTimeout(zoomIn, 1);
        }
    }

    function zoomOut() {
        camera.zoom -= 0.1;

        camera.updateProjectionMatrix();
        if (camera.zoom > 1) {
            zoomOutTimeout = setTimeout(zoomOut, 1);
        }
    }

    window.addEventListener('mouseup', (e) => {
        if (controls.enabled) {
            if (e.button === 0) {
                shooting = false;
                if (shootingTimeout !== null) {
                    clearTimeout(shootingTimeout);
                    shootingTimeout = null;
                    controls.recoil(numRecoils, -recoilAmount);
                    numRecoils = 0;
                }
            } else if (e.button === 2 && zoomingOut === false) {
                zoomingOut = true;
                clearTimeout(zoomInTimeout);
                zoomingIn = false;
                zoomOut();
            }
        }
    }, false);
    window.addEventListener('mousedown', (e) => {
        if (controls.enabled) {
            if (e.button === 0) {
                shooting = true;
                handleShooting();
            } else if (e.button === 2 && zoomingIn === false) {
                zoomingIn = true;
                clearTimeout(zoomOutTimeout);
                zoomingOut = false;
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
        setTimeout(moveMapParticles, 1)
    }
    moveMapParticles();
    const myWorker = new Worker("js/worker.js");

    function createMiniMap() {
        myWorker.postMessage({'enemies': userHandler.others, 'width': 200, 'height': 200, 'offset': 20, 'mapSize': mapSize, 'username': username});
        setTimeout(createMiniMap, 1)
    }
    const mapSelector = document.getElementById('map-wrapper');
    mapSelector.hidden = false;
    myWorker.onmessage = function(e) {
        mapSelector.innerHTML = `<div id="map">${e.data}</div>`;
    };
    createMiniMap();

    function calculateCollisions() {


        setTimeout(calculateCollisions, 1)
    }
    calculateCollisions();


    function loop() {
        const collisionBoundsOfCharacter = userCharacter.children[0].clone();
        collisionBoundsOfCharacter.matrix = userCharacter.matrix;
        collisionBoundsOfCharacter.position.add(userCharacter.position);
        const collisions = detectCollisions(collisionBoundsOfCharacter, collidableMeshList.concat(collidableEnemies));
        if (collisions.length !== 0) {
            controls.undoMovement();
            controls.dontAllowMovement(collisions[0][1]);
        } else {
            controls.allowAllMovements();
        }
        lineOfSight = detectBullets(camera.position, vector, collidableMeshList.concat(collidableEnemies));
        setTimeout(controls.update(clock.getDelta()), 0);


        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x, vector.z);

        const thetaX = -Math.asin(vector.y, 1) + radians(180);
        userCharacter.rotation.y = theta;
        userCharacter.gun.rotation.x = thetaX;

        userCharacter.position.x = camera.position.x;
        userCharacter.position.z = camera.position.z;
        userCharacter.position.y = camera.position.y - 37;


        // moveNPCs();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }

    loop();
}

