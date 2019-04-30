function setupMap(scene) {
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    let spotLightPosition = [1000, 5000, -10000];
    let spotLight = new THREE.SpotLight(0xffffff, 1);
    let collidableMeshList = []
    spotLight.position.set(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 90;

    scene.add(spotLight);
    let moon = new THREE.Mesh(new THREE.SphereGeometry(1500, 12, 52), new THREE.MeshPhongMaterial({
        refractionRatio: 0.1,
        reflectivity: 0.04,
        color: 0xf5f3ce
    }));
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
    let snowman1 = new Character('');
    snowman1.position.y += 10;
    scene.add(snowman1);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman1));

    let snowman2 = new Character('');
    snowman2.position.set(30, 15, -10);
    snowman2.scale.set(.8, .8, .8);
    scene.add(snowman2);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman2));

    let snowman3 = new Character('');
    snowman3.position.set(-30, 20, -12);
    scene.add(snowman3);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman3));

    floor = new THREE.Mesh(new THREE.PlaneGeometry(10000, 20000, 1, 1), new THREE.MeshPhongMaterial({color: 0x964B00}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);


    let verticalMirror = new Mirror();
    verticalMirror.position.y = 60;
    verticalMirror.position.x = 0;
    verticalMirror.position.z = 50;
    scene.add(verticalMirror);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(verticalMirror));

    let ramp = new Ramp(640, 160, 45, {'x': 120, 'y': 200, 'z': 200});
    scene.add(ramp);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(ramp));

    // mapDynamics = setupSnow(scene); //TODO removed snow...maybe add back?
    const mapDynamics = () => {};
    const trees = setupTrees(scene);
    collidableMeshList = collidableMeshList.concat(trees);
    return {'collidableMeshList': collidableMeshList, 'mapDynamics': mapDynamics}
}

function setupSnow(scene) {
    let particleCount = 50000;
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

    return moveParticles = function () {
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


}

function setupTrees(scene) {

    let treeGroup = new THREE.Group();
    let collisions = [];
    for (let z = -10; z < 10; z++) {
        for (let x = -10; x < 10; x++) {
            let tree = new Tree();
            let variation = (Math.random() - .5) * 50;
            tree.position.z = (z * (Math.random() * 51 + 170)) - (10 * 80) + variation;
            tree.position.x = (x * (Math.random() * 51 + 170)) - (8 * 80) + variation;

            if (tree.position.x > -600 && tree.position.x < 600 && tree.position.y > -600 && tree.position.y < 600 && tree.position.z > -600 && tree.position.z < 600) {
            } else {
                treeGroup.add(tree);
                collisions = collisions.concat(calculateCollisionPoints(tree))
            }
        }
    }
    treeGroup.rotation.y = 1;

    scene.add(treeGroup);
    return collisions;
}