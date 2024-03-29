const config = new Config();

window.onload = function init() {
    fetch('./config.json')
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }

                // Examine the text in the response
                response.json().then(function (data) {
                    config.protocol = data.protocol;
                    config.local = data.local;
                    setupLogin();
                });
            }
        )
        .catch(function (err) {
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
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    renderer.precision = "lowp"; // TODO mediump? highp? system dependent?
    renderer.alpha = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.powerPreference = "high-performance";
    renderer.setPixelRatio( window.devicePixelRatio); // can set to reduce image quality (with lower values)
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.domElement.id = 'main-canvas';

    function resizeRenderer() {

        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.onresize = resizeRenderer;

    document.body.appendChild(renderer.domElement);
    domElement = document.getElementById('main-canvas');

    const camera = new THREE.PerspectiveCamera(
        90, // Field of view
        16 / 9, // Aspect ratio
        0.1, // Near clipping pane
        20, // Far clipping pane
    );
    camera.position.set(-1, 1, 4.5);

    camera.lookAt(new THREE.Vector3(0, 1, 0));


    const controls = new THREE.FirstPersonControls(camera, domElement);
    scene.background = new THREE.Color(0x5C646C);
    scene.fog = new THREE.FogExp2(0x5C646C, 0.09);

    controls.movementSpeed = 2.50;
    controls.lookSpeed = 0.002;
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
    let gunThetaX = 0;
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
    let attacks = {};
    let shootingTimeout = null;
    let userCharacter = new Character(username, noFace = true, isMainCharcter = true);
    const hitmarkerSelector = document.getElementById("hitmarker-wrapper");
    scene.add(userCharacter);
    // makeNPCs(scene);

    const box = new THREE.Box3().setFromObject(userCharacter);
    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;

    renderer.render(scene, camera);

    var listener = new THREE.AudioListener();
    camera.add(listener);
    var audioLoader = new THREE.AudioLoader();

    var shootingSound = new THREE.Audio(listener);
    audioLoader.load('audio/gun.mp3', function (buffer) {
        shootingSound.setBuffer(buffer);
        shootingSound.setVolume(0.25);
    });

    var headshotSound = new THREE.Audio(listener);
    audioLoader.load('audio/headshot.wav', function (buffer) {
        headshotSound.setBuffer(buffer);
        headshotSound.setVolume(1);
    });

    var hitmarkerSound = new THREE.Audio(listener);
    audioLoader.load('audio/hitmarker.mp3', function (buffer) {
        hitmarkerSound.setBuffer(buffer);
        hitmarkerSound.setVolume(0.5);
    });

    var footstepSound = new THREE.Audio(listener);
    audioLoader.load('audio/footstep.wav', function (buffer) {
        footstepSound.setBuffer(buffer);
        footstepSound.setVolume(0.8);
    });
    controls.footstepSound = footstepSound;

    var jumpSound = new THREE.Audio(listener);
    audioLoader.load('audio/jump1.wav', function (buffer) {
        jumpSound.setBuffer(buffer);
        jumpSound.setVolume(1.5);
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
    let currentAttackDamage = {};
    let currentAttackTimeouts = {};
    let lastAttacked = '';
    let damageIndicator = document.getElementById('damage-indicator');
    function showDamageMarker(enemy, damage) {
        if (enemy in currentAttackDamage) {
            window.cancelIdleCallback(currentAttackTimeouts[enemy]);
            currentAttackDamage[enemy] += damage;
            damageIndicator.hidden = false;
        } else {
            currentAttackDamage[enemy] = damage;
        }
        currentAttackTimeouts[enemy] = window.requestIdleCallback(() => {damageIndicator.hidden = true; delete currentAttackDamage[enemy]}, {'timeout': 2000});

        damageIndicator.innerText = currentAttackDamage[enemy];

    }
    function handleEnemies() {
        userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.gun.rotation.x, userCharacter.health, {}, '' ,shooting);
        collidableEnemies = [];
        const usersSeen = {};
        const othersKeys = Object.keys(userHandler.others);
        for (let i = 0; i < othersKeys.length; i++) {
            const enemy = userHandler.others[othersKeys[i]];
            killCount = enemy.kill_log.kill_count;
            damage = enemy.kill_log.damage;

            if (enemy.username === username) {
                if (damage[username] !== userCharacter.damage) {
                    showDamageMarker(lastAttacked, damage[username] - userCharacter.damage); // todo what if negative

                    userCharacter.damage = damage[username];
                    if (hitmarkerSound.isPlaying) {
                        hitmarkerSound.stop();
                    }
                    hitmarkerSound.play();
                    if (hitmarkerSelector.hidden === true) {
                        window.cancelIdleCallback(hideHitmarkerTimeout);
                        hitmarkerSelector.hidden = false;
                        hideHitmarkerTimeout = window.requestIdleCallback(hideHitmarker, {'timeout': 500})
                    }
                }
                continue;
            }
            // todo: terrible way to receive damage. others can max this value.
            if (!(enemy.username in enemies)) {
                enemies[enemy.username] = new Character(enemy.username);
                enemies[enemy.username].shootingSound = new THREE.PositionalAudio( listener );
                audioLoader.load( 'audio/gun.mp3', function( buffer ) {
                    enemies[enemy.username].shootingSound.setBuffer( buffer );
                    enemies[enemy.username].shootingSound.setVolume(0.25);
                    enemies[enemy.username].shootingSound.setRefDistance(0.40 );

                });

                enemies[enemy.username].footstepSound = new THREE.PositionalAudio( listener );
                audioLoader.load( 'audio/footstepenemy.wav', function( buffer ) {
                    enemies[enemy.username].footstepSound.setBuffer( buffer );
                    enemies[enemy.username].footstepSound.setVolume(0.8);
                    enemies[enemy.username].footstepSound.setRefDistance(0.40 );

                });

                enemies[enemy.username].shootingClock = new THREE.Clock();
                enemies[enemy.username].shootingClock.timeInterval = 0;

                enemies[enemy.username].footstepClock = new THREE.Clock();
                enemies[enemy.username].footstepClock.timeInterval = 0;

                scene.add(enemies[enemy.username]);
                enemies[enemy.username].add(enemies[enemy.username].shootingSound);
                enemies[enemy.username].add(enemies[enemy.username].footstepSound);

                infoMessages.push(enemy.username, '', 'has entered the game', '');
            }
            const currentEnemy = enemies[enemy.username];
            if (currentEnemy.position.x !== enemy.x || currentEnemy.position.y !== enemy.y || currentEnemy.position.z !== enemy.z) {
                currentEnemy.footstepClock.timeInterval += currentEnemy.footstepClock.getDelta();
                if ( currentEnemy.footstepClock.timeInterval*10 > 1) {//todo  wtf it should be timeInterval / 1000 > 1 since timeInterval should be in seconds...
                    currentEnemy.footstepClock.timeInterval = 0;
                    if (currentEnemy.footstepSound.isPlaying) {
                        currentEnemy.footstepSound.stop()
                    }
                    currentEnemy.footstepSound.play();
                }
            }
            if (enemy.shooting) {
                currentEnemy.shootingClock.timeInterval += currentEnemy.shootingClock.getDelta();
                if (currentEnemy.shootingClock.timeInterval*10 > 1) {//todo  wtf it should be timeInterval / 1000 > 1 since timeInterval should be in seconds...
                    currentEnemy.shootingClock.timeInterval = 0;
                    if (currentEnemy.shootingSound.isPlaying) {
                        currentEnemy.shootingSound.stop()
                    }
                    currentEnemy.shootingSound.play();
                }
            }
            currentEnemy.position.set(enemy.x, enemy.y, enemy.z);
            currentEnemy.rotation.y = enemy.theta;
            currentEnemy.gun.rotation.x = enemy.gunThetaX - radians(180);
            currentEnemy.head.rotation.x = enemy.gunThetaX - radians(180);
            // currentEnemy.eye1.rotation.x = enemy.gunThetaX - radians(180); // todo (make head a single group that can be rotated)
            // currentEnemy.eye2.rotation.x = enemy.gunThetaX - radians(180);
            // currentEnemy.nose.rotation.x = enemy.gunThetaX - radians(180);
            currentEnemy.healthBar.scale.x = Math.max(enemy.health / 100, 0.0000001);
            currentEnemy.health = enemy.health;
            // = userCharacter.rotation;
            enemyUsername = currentEnemy.rotateUserInfo(theta);
            usersSeen[enemy.username] = true;
        }
        const enemyKeys = Object.keys(enemies);
        for (let i = 0; i < enemyKeys.length; i++) {
            if (!(enemyKeys[i] in usersSeen)) {
                infoMessages.push(enemies[enemyKeys[i]].username, '', 'has left the game', '');
                scene.remove(enemies[enemyKeys[i]]); // todo dispose of geometry and material ? .dispose()
                delete enemies[enemyKeys[i]];
            } else {
                collidableEnemies = collidableEnemies.concat(calculateCollisionPoints(enemies[enemyKeys[i]]));
            }
        }
        window.requestIdleCallback(handleEnemies, {'timeout': 30});
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
                    userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.gun.rotation.x, userCharacter.health, {}, enemy.username, shooting);
                    camera.position.set(3 - Math.random(), 0.70, 4 - Math.random());
                }
                attacks[enemy.attack.uuid] = true;
            }

        }

        window.requestIdleCallback(handleDamageAndKills, {'timeout': 20});

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
        window.requestIdleCallback(handleMessages, {'timeout': 1000});
    }

    handleMessages();

    function handleInfos() {
        let txt = '';
        infoMessages.messages.forEach((i) => {
            txt += `${i.message}<br>`;
        });
        document.getElementById('info-messages').innerHTML = txt;
        window.requestIdleCallback(handleInfos, {'timeout': 30});
    }

    handleInfos();

    function handleHealth() {
        document.getElementById('health').innerHTML = userCharacter.health;
        window.requestIdleCallback(handleHealth, {'timeout': 30});
    }

    handleHealth();

    const damageAmount = 40;

    function handleKills() {
        let kills = '';
        const keys = Object.keys(killCount);
        for (let i = 0; i < keys.length; i++) {
            kills += `<tr> <td> ${keys[i]}</td> <td>${killCount[keys[i]]}</td><td>${damage[keys[i]]}</td></tr>`;
        }
        document.getElementById('kills').innerHTML = kills;
        window.requestIdleCallback(handleKills, {'timeout': 1000});

    }

    handleKills();
    const bloodGeometry = new THREE.SphereGeometry(0.02, 52, 52);
    const bloodMaterial = new THREE.MeshPhongMaterial({
        refractionRatio: 0.1,
        reflectivity: 0.04,
        color: 0xff0000,
    });
    const bulletHoleGeometry =new THREE.BoxGeometry(0.03, 0.03, 0.03);
    const bulletHoleMaterial =new THREE.MeshMatcapMaterial({
        color: 0x4e555b,
    });
    // TODO: terrible way to handle shooting - timing will be messed up...
    function handleShooting() {
        lineOfSight = detectBullets(camera.position, vector, collidableMeshList.concat(collidableEnemies));

        if (shootingSound.isPlaying) {
            shootingSound.stop();
        }

        if (headshotSound.isPlaying) {
            headshotSound.stop();
        }

        let finalDamageAmount = damageAmount;
        if (lineOfSight.length > 0 && lineOfSight[0].object.isHead === true) {
            finalDamageAmount *= 2.5;
            headshotSound.play();
        }
        shootingSound.play();

        if (numRecoils < recoilMax) {
            controls.recoil(1, recoilAmount);
            numRecoils += 1;
        } else {
            controls.recoil(1, recoilAmount);
            window.requestIdleCallback(() => {
                controls.recoil(1, -recoilAmount)
            }, {'timeout': 30})
        }
        userCharacter.gun.recoil(30);
        if (lineOfSight.length > 0 && lineOfSight[0].object.parent.username !== undefined) {


            const enemy = lineOfSight[0];
            const point = enemy.point;
            const bloodSphere = new THREE.Mesh(bloodGeometry, bloodMaterial);
            bloodSphere.position.set(point.x, point.y, point.z);

            function removeBloodSphere() {
                scene.remove(bloodSphere)
            }

            scene.add(bloodSphere);
            window.requestIdleCallback(removeBloodSphere, {'timeout': 100});
            const attack = {'username': enemy.object.parent.username, 'damage': finalDamageAmount};
            lastAttacked = enemy.object.parent.username;

            userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y, userCharacter.gun.rotation.x, userCharacter.health, attack, '', shooting);
        } else if (lineOfSight.length > 0) {
            const collisionObject = lineOfSight[0];
            const point = collisionObject.point;

            const bulletHole = new THREE.Mesh(bulletHoleGeometry, bulletHoleMaterial);
            bulletHole.position.set(point.x, point.y, point.z);

            function removeBulletHole() {
                scene.remove(bulletHole)
            }

            scene.add(bulletHole);
            window.requestIdleCallback(removeBulletHole, {'timeout': 10000})
        }

        shootingTimeout = window.requestIdleCallback(handleShooting, {'timeout': 100});
    }


    let zoomingIn = false;
    let zoomingOut = false;
    let zoomInTimeout;
    let zoomOutTimeout;
    const scopeSelector = document.getElementById('scope');
    const crosshair = document.getElementById('crosshair');
    function zoomIn() {
        controls.lookSpeed = 0.001;
        scopeSelector.hidden = false;
        crosshair.hidden = true;
        camera.zoom = 6;
        camera.updateProjectionMatrix();
        // if (camera.zoom < 1.5) {
            // zoomInTimeout = window.requestIdleCallback(zoomIn, {'timeout': 1}); // TODO smooth zoom lags
        // }
    }
    function zoomOut() {
        controls.lookSpeed = 0.002;
        scopeSelector.hidden = true;
        crosshair.hidden = false;
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        // if (camera.zoom > 1) {
            // zoomOutTimeout = window.requestIdleCallback(zoomOut, {'timeout': 1}); // TODO smooth zoom lags
        // }
    }

    window.addEventListener('mouseup', (e) => {
        if (controls.enabled) {
            if (e.button === 0) {
                shooting = false;
                if (shootingTimeout !== null) {
                    window.cancelIdleCallback(shootingTimeout);
                    shootingTimeout = null;
                    controls.recoil(numRecoils, -recoilAmount);
                    numRecoils = 0;
                }
            } else if (e.button === 2 && zoomingOut === false) {
                zoomingOut = true;
                window.cancelIdleCallback(zoomInTimeout);
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
                window.cancelIdleCallback(zoomOutTimeout);
                zoomingOut = false;
                zoomIn();
            }
        }
    }, false);

    let inChat = false;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'p' && !inChat) {
            listener.context.resume(); // need to resume context after user interaction
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
        window.requestIdleCallback(moveMapParticles, {'timeout': 30})
    }

    moveMapParticles();
    const myWorker = new Worker("js/minimap-worker.js");

    function createMiniMap() {
        myWorker.postMessage({
            'enemies': userHandler.others,
            'width': 200,
            'height': 200,
            'offset': 20,
            'mapSize': mapSize,
            'username': username
        });
        window.requestIdleCallback(createMiniMap, {'timeout': 30})
    }

    const mapSelector = document.getElementById('map-wrapper');
    mapSelector.hidden = false;
    myWorker.onmessage = function (e) {
        mapSelector.innerHTML = `<div id="map">${e.data}</div>`;
    };
    createMiniMap();
    //todo handle enemies here
    // const enemiesWorker = new Worker("js/enemies-worker.js");
    // function enemiesHandler() {
    //     w.postMessage({'enemies': Object.keys(enemies)});
    //     window.requestIdleCallback(enemiesHandler, 1)
    // }
    // enemiesWorker.onmessage = function(e) {
    //     // console.log(test);
    // };
    // enemiesHandler();

    const size = box.getSize();
    const characterBox = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshMatcapMaterial({
            color: 0xff0051,
        }),
    );

    function loop() {

        characterBox.matrix = userCharacter.matrix;
        characterBox.position.set(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z);
        const collisions = detectCollisions(characterBox, collidableMeshList.concat(collidableEnemies));
        if (collisions.length !== 0) {
            controls.undoMovement();
            controls.dontAllowMovement(collisions[0][1]);
        } else {
            controls.allowAllMovements();
        }
        controls.update(clock.getDelta());

        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x, vector.z);

        gunThetaX = -Math.asin(vector.y, 1) + radians(180);
        userCharacter.rotation.y = theta;
        userCharacter.gun.rotation.x = gunThetaX;

        userCharacter.position.x = camera.position.x;
        userCharacter.position.z = camera.position.z;
        userCharacter.position.y = camera.position.y - 0.37;

        var t0 = performance.now();
        renderer.render(scene, camera);
        var t1 = performance.now();
        console.log("Call to loop took " + (t1 - t0) + " milliseconds.")

        requestAnimationFrame(loop);
    }

    loop();
}

