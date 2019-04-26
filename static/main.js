window.onload = function init() {


    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(
        90,                                   // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1,                                  // Near clipping pane
        12000                                  // Far clipping pane
    );

    camera.position.set(0, 100, 200);

    camera.lookAt(new THREE.Vector3(0, 15, 0));
    controls = new THREE.FirstPersonControls(camera);

    controls.movementSpeed = 200;
    controls.lookSpeed = 0.2;
    controls.lookVertical = true;
    controls.activeLook = false;
    controls.constrainVertical = true;
    controls.moveUp = false;
    controls.moveDown = false;

    let renderer = new THREE.WebGLRenderer({antialias: true});

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setClearColor(0x000000);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);


    let spotLightPosition = [1000, 5000, -10000];
    let spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 90;

    scene.add(spotLight);


    let moon = new THREE.Mesh(new THREE.SphereGeometry(1500, 12, 52), new THREE.MeshPhongMaterial({refractionRatio: 0.1, reflectivity: 0.04, color: 0xf5f3ce}));
    moon.position.set(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);

    scene.add(moon);

    let spotLight2 = new THREE.SpotLight(0xffffff);
    spotLight2.position.set(-30, 2000, -1000);

    spotLight2.castShadow = true;

    spotLight2.shadow.mapSize.width = 1024;
    spotLight2.shadow.mapSize.height = 1024;

    spotLight2.shadow.camera.near = 500;
    spotLight2.shadow.camera.far = 4000;
    spotLight2.shadow.camera.fov = 5;
    spotLight2.angle = radians(10);
    spotLight2.target = moon;
    scene.add(spotLight2);

    let snowman1 = new Snowman();
    snowman1.position.y += 10;
    scene.add(snowman1);

    let snowman2 = new Snowman();
    snowman2.position.set(30, 15, -10);
    snowman2.scale.set(.8, .8, .8);
    scene.add(snowman2);

    let snowman3 = new Snowman();
    snowman3.position.set(-30, 20, -12);
    scene.add(snowman3);

    floor = new THREE.Mesh(new THREE.PlaneGeometry(10000, 20000, 1, 1), new THREE.MeshPhongMaterial({color: 0x964B00}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);


    renderer.render(scene, camera);

    let particleCount = 100000;
    let pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 4,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        transparent: false
    });
    pMaterial.castShadow = true;
    pMaterial.receiveShadow = true;
    let particles = new THREE.Geometry;

    for (let i = 0; i < particleCount; i++) {
        let pX = Math.random() * 4000 - 2000,
            pY = Math.random() * 2000 - 1000,
            pZ = Math.random() * 4000 - 2000,
            particle = new THREE.Vector3(pX, pY, pZ);
        particle.velocity = {};
        particle.velocity.y = -1;
        particle.velocity.x = -0.2 + Math.random() * .4;
        particles.vertices.push(particle);
    }

    let particleSystem = new THREE.Points(particles, pMaterial);
    particleSystem.position.y = 200;
    scene.add(particleSystem);

    let moveParticles = function () {
        let pCount = particleCount;
        while (pCount--) {
            let particle = particles.vertices[pCount];
            if (particle.y < -190 && pCount < 20000) {
                particle.velocity.y = 0;
                particle.velocity.x = 0;

            } else if (particle.y < -200) {
                particle.y = 200;
                particle.velocity.y = -0.5;
                particle.velocity.y -= Math.random() * .2;
                particle.velocity.x = -0.2 + Math.random() * .4;

            }

            particle.y += particle.velocity.y;
            particle.x += particle.velocity.x;
        }
        particles.verticesNeedUpdate = true;
    };

    let treeGroup = new THREE.Group();

    for (let z = -10; z < 10; z++) {
        for (let x = -10; x < 10; x++) {
            let tree = new Tree();
            let variation = (Math.random() - .5) * 50;
            tree.position.z = (z * (Math.random()*51 + 170)) - (10 * 80) + variation;
            tree.position.x = (x *(Math.random()*51 +  170)) - (8 * 80) + variation;

            if (tree.position.x > -100 && tree.position.x < 100 && tree.position.y > -100 && tree.position.y < 100 && tree.position.z > -100 && tree.position.z < 100) {
            } else {
                treeGroup.add(tree);
            }
        }
    }

    treeGroup.rotation.y = 1;
    scene.add(treeGroup);

    mainSnowman = new Snowman(noFace = true);
    mainSnowman.position.set(30, 15, 40);
    scene.add(mainSnowman);

    let box = new THREE.Box3().setFromObject(mainSnowman);
    console.log(box.min, box.max, box.getSize());

    camera.position.y = box.getSize().y;
    controls.initialY = camera.position.y;
    let verticalMirror = new Mirror();
    verticalMirror.position.y = 60;
    verticalMirror.position.x = 0;
    verticalMirror.position.z = 50;

    scene.add(verticalMirror);


    let npcs = [];
    for (let i = 0; i < 20; i ++) {
        let s = new Snowman();
        s.position.set(-1000 + Math.random() * 2000, 15, -1000 + Math.random() * 2000);
        npcs.push(s);
        s.velocity = {'x': 0, 'z': 0};
        s.velocity.z = -3 + Math.random() * 6;
        s.velocity.x = -3 + Math.random() * 6;

        s.counter = 0;
        scene.add(s);

    }
    console.log(npcs)

    let moveNPCs = function () {
        let nCount = npcs.length;
        while (nCount--) {
            let npc = npcs[nCount];
            if (npc.position.z < 2000 && npc.position.z > -2000 && npc.position.x < 2000 && npc.position.x > -2000) {
                if (npc.counter > 100) {
                    npc.velocity.z = -5 + Math.random() * 10;
                    npc.velocity.x = -5 + Math.random() * 10;
                    npc.counter = 0;
                } else {
                    npc.counter = npc.counter + 1;
                }
            } else {
                npc.position.z = 0;
                npc.position.x = 0;
            }

            npc.position.z += npc.velocity.z;
            npc.position.x += npc.velocity.x;
            npc.verticesNeedUpdate = true;

        }

    };

    let messageHandler = new MessageHandler();
    let clock = new THREE.Clock();

    function loop() {
        controls.update(clock.getDelta());
        let t = subtractA(controls.targetPosition, controls.position);
        mainSnowman.position.x = camera.position.x;
        mainSnowman.position.z = camera.position.z + 5;
        mainSnowman.position.y = camera.position.y - 37;
        moveParticles();
        moveNPCs();
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    }

    loop();
};

function subtractA(a, b) {
    return new THREE.Vector3(a.x - b.x, a.y - b.y, a.z - b.z)
}

class Mirror extends THREE.Group {
    constructor() {
        super();
        const geometry = new THREE.PlaneBufferGeometry(100, 100);
        const verticalMirror = new THREE.Reflector(geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x889999,
            recursion: 1
        });
        const mirrorBase = new THREE.Mesh(
            new THREE.BoxGeometry(160, 160, 3),
            new THREE.MeshStandardMaterial({
                color: 0x6f7c7c,
                flatShading: THREE.FlatShading,
                metalness: 0,
                roughness: 0.8,
                refractionRatio: 0.25

            })
        );
        mirrorBase.position.z += 3;
        mirrorBase.rotateY(radians(180));
        verticalMirror.rotateY(radians(180));
        this.add(verticalMirror);
        this.add(mirrorBase);

    }
}

class MessageHandler {
    constructor() {
        var self = this;
        this.others = [];
        console.log(window.location.host);
        this.ws = new WebSocket('ws://' + window.location.host + '/ws');
        this.ws.addEventListener('message', function(e) {
            var msg = JSON.parse(e.data);
            for (i = 0; i < msg.length; i++) {

            }

            var element = document.getElementById('chat-messages');
            element.scrollTop = element.scrollHeight; // Auto scroll to the bottom
        });


        this.keepAlive()

    }
    gravatarURL(email) {
        return 'http://www.gravatar.com/avatar/' + CryptoJS.MD5(email);
    }

    keepAlive() {
        console.log("pinging");
        if (this.ws.readyState === this.ws.OPEN) {
            this.ws.send(JSON.stringify({
                email: "ping",
                username: "ping",
                message: "ping"
            }))
        } else {
            console.log("was not ready, was: ", this.ws.readyState)
        }
        setTimeout(this.keepAlive, 15000);
    }
    function () {
        if (this.newMsg !== '') {
            this.ws.send(
                JSON.stringify({
                        email: this.email,
                        username: this.username,
                        message: $('<p>').html(this.newMsg).text() // Strip out html
                    }
                ));
            this.newMsg = ''; // Reset newMsg
        }
    }
}



/**
 * Helper function to add random noise to geometry vertices
 *
 * @param geometry The geometry to alter
 * @param noiseX Amount of noise on the X axis
 * @param noiseY Amount of noise on the Y axis
 * @param noiseZ Amount of noise on the Z axis
 * @returns the geometry object
 */
function addNoise(geometry, noiseX, noiseY, noiseZ) {

    noiseX = noiseX || 2;
    noiseY = noiseY || noiseX;
    noiseZ = noiseZ || noiseY;

    for (let i = 0; i < geometry.vertices.length; i++) {
        let v = geometry.vertices[i];
        v.x += -noiseX / 2 + Math.random() * noiseX;
        v.y += -noiseY / 2 + Math.random() * noiseY;
        v.z += -noiseZ / 2 + Math.random() * noiseZ;
    }

    return geometry;
}

const globalColors = {
    'snowman': '#bcfeff',
    'carrot': '#ed9121',
    'eye': '#000000'
};

class Snowman extends THREE.Group {
    constructor(noFace = false) {
        super();
        let colors = ['#ff0051', '#f56762', '#a53c6c', '#f19fa0', '#72bdbf', '#47689b'];
        // The main bauble is an Octahedron
        const snowMaterial = new THREE.MeshPhysicalMaterial({
            color: globalColors['snowman'],
            flatShading: THREE.FlatShading,
            metalness: 0,
            reflectivity: 1,
            roughness: 0.8,
            refractionRatio: 0.25

        });
        const bottom = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(17, 1), 2),
            snowMaterial
        );
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        bottom.rotateZ(Math.random() * Math.PI * 2);
        bottom.rotateY(Math.random() * Math.PI * 2);
        this.add(bottom);


        // A Torus to represent the top hook
        const body = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(10, 1), 2),
            snowMaterial
        );
        body.position.y += 22;
        body.castShadow = true;
        body.receiveShadow = true;
        body.rotateZ(Math.random() * Math.PI * 2);
        body.rotateY(Math.random() * Math.PI * 2);

        this.add(body);
        // A Torus to represent the top hook
        const head = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(7, 1), 2),
            snowMaterial
        );
        head.name = "head";
        head.position.y += 37;
        head.castShadow = true;
        head.receiveShadow = true;
        head.rotateZ(Math.random() * Math.PI * 2);
        head.rotateY(Math.random() * Math.PI * 2);

        this.head = head;
        this.add(this.head);
        if (!noFace) {
            const nose = new THREE.Mesh(
                new THREE.ConeGeometry(2, 10),
                new THREE.MeshStandardMaterial({
                    color: globalColors['carrot'],
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25

                })
            );
            nose.position.y += 37;
            nose.castShadow = true;
            nose.receiveShadow = true;
            nose.rotateZ(radians(90));
            nose.rotateX(radians(getRandomInt(60, 90)));
            nose.position.z += 7;
            this.add(nose);

            const eye1 = new THREE.Mesh(
                new THREE.SphereGeometry(2, 10, 32),
                new THREE.MeshStandardMaterial({
                    color: globalColors['eye'],
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25

                })
            );
            eye1.position.y += 40;
            eye1.castShadow = true;
            eye1.receiveShadow = true;
            eye1.position.z += 4;
            eye1.position.x -= 2;
            this.add(eye1);
            const eye2 = new THREE.Mesh(
                new THREE.SphereGeometry(2, 10, 32),
                new THREE.MeshStandardMaterial({
                    color: globalColors['eye'],
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25

                })
            );
            eye2.position.y += 40;
            eye2.castShadow = true;
            eye2.receiveShadow = true;
            eye2.position.z += 4;
            eye2.position.x += 2;
            this.add(eye2);
        }

    }
}

class Tree extends THREE.Group {
    constructor() {
        super();

        let trunkColor = '#ffaa00';
        let treeColors = ['#4d9e3a', '#36662b', '#2a7519', '#367727', '#d9e0d7'];
        let treeMaterial = new THREE.MeshPhongMaterial({
            color: treeColors[Math.floor(Math.random() * treeColors.length)],
            flatShading: THREE.FlatShading,
            refractionRatio: 0.25,
            reflectivity: 0.1,
        });

        let trunk = new THREE.Mesh(
            addNoise(new THREE.CylinderGeometry(20, 20, 20, 4), 2),
            new THREE.MeshPhongMaterial({
                color: trunkColor,
                flatShading: THREE.FlatShading,
                refractionRatio: 0.25

            })
        );
        // const body = new THREE.Mesh(
        //     addNoise(new THREE.OctahedronGeometry(10, 1), 2),
        //     new THREE.MeshStandardMaterial({
        //         color: colors[Math.floor(Math.random() * colors.length)],
        //         flatShading: THREE.FlatShading,
        //         metalness: 0,
        //         roughness: 0.8,
        //         refractionRatio: 0.25
        //
        //     })
        // );

        trunk.position.y = 10;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.add(trunk);
        let bottom = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 50, 120, 18), 11), treeMaterial);
        bottom.position.y = 80;
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        this.add(bottom);
        let mid = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 40, 100, 17), 11), treeMaterial);
        mid.position.y = 110;
        mid.castShadow = true;
        mid.receiveShadow = true;
        this.add(mid);
        let top = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 30, 80, 14), 11), treeMaterial);
        top.position.y = 140;
        top.castShadow = true;
        top.receiveShadow = true;
        this.add(top);

        this.variation = (Math.random() - .5) - 0.1;

        this.scale.x = 1 + this.variation;
        this.scale.y = 1 + this.variation;
        this.scale.z = 1 + this.variation;
        this.rotation.y = Math.random() * Math.PI;
    }
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * Math.floor(max - min) + min);
}

