function setupMap(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.004);
    scene.add(ambientLight);
    const spotLightPosition = [100, 10000, -7000];
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    let collidableMeshList = [];
    spotLight.position.set(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 300;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 90;

    scene.add(spotLight);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1500, 12, 52), new THREE.MeshPhongMaterial({
        refractionRatio: 0.1,
        reflectivity: 0.04,
        color: 0xf5f3ce,
    }));
    moon.position.set(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);

    scene.add(moon);

    const spotLight2 = new THREE.SpotLight(0xffffff, 100000);
    spotLight2.position.set(-30, 1000, 5000);

    spotLight2.castShadow = true;

    spotLight2.shadow.mapSize.width = 1024;
    spotLight2.shadow.mapSize.height = 1024;

    spotLight2.shadow.camera.near = 500;
    spotLight2.shadow.camera.far = 4000;
    spotLight2.shadow.camera.fov = 5;
    spotLight2.angle = radians(10);
    spotLight2.target = moon;
    scene.add(spotLight2);
    const snowman1 = new Character('');
    snowman1.position.y += 10;
    scene.add(snowman1);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman1));

    const snowman2 = new Character('');
    snowman2.position.set(30, 15, -10);
    snowman2.scale.set(0.8, 0.8, 0.8);
    scene.add(snowman2);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman2));

    const snowman3 = new Character('');
    snowman3.position.set(-30, 20, -12);
    scene.add(snowman3);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(snowman3));

    floor = new THREE.Mesh(new THREE.PlaneGeometry(100000, 200000, 1, 1), new THREE.MeshLambertMaterial({color: 0x964B00}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    collidableMeshList = collidableMeshList.concat(createBuilding(scene, 300, 200));
    const verticalMirror = new Mirror();
    verticalMirror.position.y = 60;
    verticalMirror.position.x = 0;
    verticalMirror.position.z = 50;
    scene.add(verticalMirror);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(verticalMirror));

    const ramp = new Ramp(640, 160, 45, {x: 400, y: 200, z: 200});
    scene.add(ramp);
    collidableMeshList = collidableMeshList.concat(calculateCollisionPoints(ramp));

    const mapDynamics = setupSnow(scene); //TODO removed snow...maybe add back?
    // const mapDynamics = () => {};
    const trees = setupTrees(scene);
    collidableMeshList = collidableMeshList.concat(trees);

    setupClouds(scene);
    return {collidableMeshList, mapDynamics};
}

function setupSnow(scene) {
    const particleCount = 30000;
    const pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 4,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        transparent: false,
    });
    pMaterial.castShadow = true;
    pMaterial.receiveShadow = true;
    const particles = new THREE.Geometry();

    for (let i = 0; i < particleCount; i++) {
        let pX = Math.random() * 6000 - 2000,
            pY = Math.random() * 2000 - 1000,
            pZ = Math.random() * 6000 - 2000,
            particle = new THREE.Vector3(pX, pY, pZ);
        particle.velocity = {};
        particle.velocity.y = -1;
        particle.velocity.x = -0.2 + Math.random() * 0.4;
        particles.vertices.push(particle);
    }

    const particleSystem = new THREE.Points(particles, pMaterial);
    particleSystem.position.y = 0;
    scene.add(particleSystem);

    return moveParticles = function () {
        let pCount = particleCount;
        while (pCount--) {
            const particle = particles.vertices[pCount];
            if (pCount < 10000 && particle.y >= 10 && particle.y <= 11) {
                particle.velocity.y = 0;
                particle.velocity.x = 0;
            } else if (particle.y < 0) {
                particle.y = Math.random() * 2000 - 1000;
                particle.velocity.y = -0.5;
                particle.velocity.y -= Math.random() * 0.2;
                particle.velocity.x = -0.2 + Math.random() * 0.4;
            }

            particle.y += particle.velocity.y;
            particle.x += particle.velocity.x;
        }
        particles.verticesNeedUpdate = true;
    };
}

function setupTrees(scene) {
    const treeGroup = new THREE.Group();
    let collisions = [];
    for (let z = -10; z < 10; z++) {
        for (let x = -10; x < 10; x++) {
            const tree = new Tree();
            const variation = (Math.random() - 0.5) * 50;
            tree.position.z = (z * (Math.random() * 51 + 250)) - (10 * 80) + variation;
            tree.position.x = (x * (Math.random() * 51 + 250)) - (8 * 80) + variation;

            if (tree.position.x > -1900 && tree.position.x < -700  && tree.position.z > -1900 && tree.position.z < -700) {
                tree.position.x += 3000;
                tree.position.z += 3000;
                treeGroup.add(tree);
                collisions = collisions.concat(calculateCollisionPoints(tree));

            } else {
                treeGroup.add(tree);
                collisions = collisions.concat(calculateCollisionPoints(tree));
            }
        }
    }
    const box = new THREE.Box3().setFromObject(treeGroup);
    treeGroup.position.x += box.getSize().x/4;
    treeGroup.position.z += box.getSize().z/4;

    scene.add(treeGroup);

    return collisions;
}

function setupClouds(scene) {
    const cloudGroup = new THREE.Group();
    for (let z = -10; z < 10; z++) {
        for (let x = -10; x < 10; x++) {
            const cloud = new Cloud(Math.random()*300 + 30);
            const variation = (Math.random() - 0.5) * 1000;
            cloud.position.z = (z * (Math.random() * 51 + 700)) - (10 * 80) + variation;
            cloud.position.x = (x * (Math.random() * 51 + 700)) - (8 * 80) + variation;
            cloud.position.y = Math.random()*2000 + 3000;
            cloudGroup.add(cloud);
        }
    }
    const box = new THREE.Box3().setFromObject(cloudGroup);
    cloudGroup.position.x += box.getSize().x/4;
    cloudGroup.position.z += box.getSize().z/4;

    scene.add(cloudGroup);

}

function createBuilding(scene, width, height) {
    let walls = [];
    const wall = new Wall(width, height, 0x4e555b);
    wall.position.z += width;
    wall.rotation.y = radians(90);

    scene.add(wall);
    walls = walls.concat(calculateCollisionPoints(wall));

    const wall2 = new Wall(width, height, 0x4e555b, door = true);
    wall2.position.z += 450;
    wall2.position.x -= 150;
    scene.add(wall2);
    walls = walls.concat(calculateCollisionPoints(wall2));

    const wall3 = new Wall(width, height, 0x4e555b);
    wall3.position.z += 600;
    wall3.rotation.y = radians(90);
    scene.add(wall3);
    walls = walls.concat(calculateCollisionPoints(wall3));

    const wall4 = new Wall(width, height, 0x4e555b);
    wall4.position.z += 450;
    wall4.position.x += 150;
    scene.add(wall4);
    walls = walls.concat(calculateCollisionPoints(wall4));

    const ceiling = new Ceiling(width, width);
    ceiling.position.z += 450;
    ceiling.position.y += height;
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    walls = walls.concat(calculateCollisionPoints(ceiling));

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(ceiling.position.x, ceiling.position.y-100, ceiling.position.z);

    spotLight.castShadow = true;
    spotLight.shadowDarkness = 1;
    spotLight.shadow.mapSize.width = 300;
    spotLight.shadow.mapSize.height = 300;

    spotLight.shadow.camera.near = 0.01;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.camera.fov = 360;

    scene.add(spotLight);

    const lightSphere = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 52), new THREE.MeshPhongMaterial({
        refractionRatio: 0.1,
        reflectivity: 0.04,
        color: 0xf5f3ce,
    }));
    lightSphere.position.set(ceiling.position.x, ceiling.position.y-100, ceiling.position.z);

    scene.add(lightSphere);


    return walls
}