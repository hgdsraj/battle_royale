window.onload = function init() {
    setupLogin();
};

function setupLogin() {
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


    controls.movementSpeed = 200;
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

    const sceneControlsCamera = setupCameraAndControls();
    console.log(sceneControlsCamera)
    const scene = sceneControlsCamera['scene'];
    const camera = sceneControlsCamera['camera'];
    const controls = sceneControlsCamera['controls'];
    const renderer = sceneControlsCamera['renderer'];
    var vector = new THREE.Vector3();
    let collidableMeshList = setupMap(scene);

    userCharacter = new Snowman(username, noFace = true);
    userCharacter.position.set(30, 15, 40);
    scene.add(userCharacter);
    let box = new THREE.Box3().setFromObject(userCharacter);
    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;

    renderer.render(scene, camera);


    let clock = new THREE.Clock();
    let enemies = {};

    function handleEnemies() {
        userHandler.send(userCharacter.position.x, userCharacter.position.y, userCharacter.position.z, userCharacter.rotation.y);

        let usersSeen = {};
        let othersKeys = Object.keys(userHandler.others);
        for (let i = 0; i < othersKeys.length; i++) {
            enemy = userHandler.others[othersKeys[i]];
            if (enemy.username === username) {
                continue
            }
            if (!(enemy.username in enemies)) {
                enemies[enemy.username] = new Snowman(enemy.username);
                scene.add(enemies[enemy.username]);
            }
            enemies[enemy.username].position.set(enemy.x, enemy.y, enemy.z);
            enemies[enemy.username].rotation.y = enemy.theta;
            usersSeen[enemy.username] = true;
        }
        let enemyKeys = Object.keys(enemies);
        for (let i = 0; i < enemyKeys.length; i++) {
            if (!(enemyKeys[i] in usersSeen)) {
                console.log("REMOVE");
                scene.remove(enemies[enemyKeys[i]]);
                delete enemies[enemyKeys[i]]
            }
        }
        setTimeout(handleEnemies, 20);
    }

    handleEnemies();

    function handleMessages() {
        let txt = '';
        for (let i = 0; i < chatHandler.messages.length; i++) {
            txt += `<span class="username">` + chatHandler.messages[i].username + `:</span>  ` + chatHandler.messages[i].message + `<br>`;
        }
        document.getElementById('chat-messages').innerHTML = txt;
        setTimeout(handleMessages, 20);
    }

    handleMessages();


    window.addEventListener('keydown', function (event) {
        if (event.key === 'p') {

            let pauseMenu = document.getElementById('pause-menu');
            pauseMenu.toggleAttribute('hidden')
            if (pauseMenu.hidden === true) {
                domElement.requestPointerLock();
                console.log("Requested")
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
    function loop() {
        camera.getWorldDirection(vector);
        theta = Math.atan2(vector.x, vector.z);

        userCharacter.rotation.y = theta;
        controls.update(clock.getDelta());
        let t = subtractA(controls.targetPosition, controls.position);
        userCharacter.position.x = camera.position.x;
        userCharacter.position.z = camera.position.z;
        userCharacter.position.y = camera.position.y - 37;
        moveParticles();
        // moveNPCs();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }

    loop();
    console.log(userCharacter);
    console.log(box);

    for (var vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++) {
        var localVertex = box.geometry.vertices[vertexIndex].clone();
        var globalVertex = box.matrix.multiplyVector3(localVertex);
        var directionVector = globalVertex.subSelf( box.position );

        var ray = new THREE.Ray( box.position, directionVector.clone().normalize() );
        var collisionResults = ray.intersectObjects( collidableMeshList );
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
            console.log("collision")
        }
    }
};

function subtractA(a, b) {
    return new THREE.Vector3(a.x - b.x, a.y - b.y, a.z - b.z)
}


