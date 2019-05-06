const globalColors = {
    snowman: '#bcfeff',
    carrot: '#ed9121',
    green: '#00ed06',
    red: '#ff0000',
    eye: '#000000',
};

class Mirror extends THREE.Group {
    constructor() {
        super();
        const geometry = new THREE.PlaneBufferGeometry(100, 100);
        const verticalMirror = new THREE.Reflector(geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x889999,
            recursion: 1,
        });
        const mirrorBase = new THREE.Mesh(
            new THREE.BoxGeometry(160, 160, 3),
            new THREE.MeshStandardMaterial({
                color: 0x6f7c7c,
                flatShading: THREE.FlatShading,
                metalness: 0,
                roughness: 0.8,
                refractionRatio: 0.25,

            }),
        );
        mirrorBase.castShadow = true;
        mirrorBase.position.z += 3;
        mirrorBase.rotateY(radians(180));
        verticalMirror.rotateY(radians(180));
        this.add(verticalMirror);
        this.add(mirrorBase);
    }
}

class Wall extends THREE.Group {
    constructor(width, height, color, door = false, windows = false) {
        super();
        if (door === false) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, 3),
                new THREE.MeshStandardMaterial({
                    color: color,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                }),
            );
            wall.receiveShadow = true;
            wall.castShadow = true;
            wall.rotateY(radians(90));
            wall.position.y += height / 2;
            this.add(wall);

        } else {
            const doorWidth = 50;
            const doorHeight = 100;
            const doorWidthDividedBy2 = doorWidth / 2;
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(width / 2 - doorWidthDividedBy2, doorHeight, 3),
                new THREE.MeshStandardMaterial({
                    color: color,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                }),
            );
            wall.receiveShadow = true;
            wall.castShadow = true;

            wall.rotateY(radians(90));
            wall.position.y += doorHeight / 2;
            console.log(width, doorWidth);
            console.log(width / 2 - doorWidth);
            wall.position.z -= width / 4 + doorWidth / 4;
            this.add(wall);

            const wall2 = new THREE.Mesh(
                new THREE.BoxGeometry(width / 2 - doorWidthDividedBy2, doorHeight, 3),
                new THREE.MeshStandardMaterial({
                    color: color,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                }),
            );
            wall2.position.z += width / 4 + doorWidth / 4;
            wall2.receiveShadow = true;
            wall2.castShadow = true;
            wall2.rotateY(radians(90));
            wall2.position.y += doorHeight / 2;

            this.add(wall2);

            const wall3 = new THREE.Mesh(
                new THREE.BoxGeometry(width, height - doorHeight, 3),
                new THREE.MeshStandardMaterial({
                    color: color,
                    flatShading: THREE.FlatShading,
                }),
            );
            wall3.receiveShadow = true;
            wall3.castShadow = true;
            wall3.rotateY(radians(90));
            wall3.position.y += (height - doorHeight) / 2 + doorHeight;

            this.add(wall3);

        }
    }
}

class Ceiling extends THREE.Group {
    constructor(width, length, color) {
        super();
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(width, length, 1, 1), new THREE.MeshPhongMaterial({color: color}));
        ceiling.receiveShadow = true;
        ceiling.castShadow = true;
        this.add(ceiling);
    }
}

class Cloud extends THREE.Group {
    constructor(size) {
        super();
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: true,
            refractionRatio: 0.1,
            reflectivity: 0.04,
            transparent: true
        });
        material.opacity = 0.7;
        const noiseAmount = Math.floor(size / 3);
        const tuft1 = new THREE.Mesh(
            addNoise(new THREE.SphereGeometry(size, 7, 8), noiseAmount, noiseAmount, noiseAmount),
            material
        );
        tuft1.position.x -= size;
        this.add(tuft1);

        const tuft2 = new THREE.Mesh(
            addNoise(new THREE.SphereGeometry(size, 7, 8), noiseAmount, noiseAmount, noiseAmount),
            material
        );
        tuft2.position.x += size;

        this.add(tuft2);

        const tuft3 = new THREE.Mesh(
            addNoise(new THREE.SphereGeometry(size * 1.3, 7, 8), noiseAmount, noiseAmount, noiseAmount),
            material
        );

        this.add(tuft3);
    }
}

class Ramp extends THREE.Group {
    constructor(length, width, angle, position) {
        super();
        const material = new THREE.Mesh(
            new THREE.BoxGeometry(width, length, 3),
            new THREE.MeshStandardMaterial({
                color: 0x6f7c7c,
                flatShading: THREE.FlatShading,
                metalness: 0,
                roughness: 0.8,
                refractionRatio: 0.25,

            }),
        );
        material.position.z += 3;
        material.rotateY(radians(180));
        material.rotateX(radians(angle));
        this.add(material);
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;
        material.position.z += 3;
    }
}

class Character extends THREE.Group {
    constructor(username, noFace = false, isMainCharacter = false) {
        super();
        this.health = 100;
        this.username = username;
        this.damage = 0;
        const colors = ['#ff0051', '#f56762', '#a53c6c', '#f19fa0', '#72bdbf', '#47689b'];
        // The main bauble is an Octahedron
        const snowMaterial = new THREE.MeshPhysicalMaterial({
            color: globalColors.snowman,
            flatShading: THREE.FlatShading,
            metalness: 0,
            reflectivity: 1,
            roughness: 0.8,
            refractionRatio: 0.25,

        });
        const bottom = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(17, 1), 2, 2, 2),
            snowMaterial,
        );
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        bottom.rotateZ(Math.random() * Math.PI * 2);
        bottom.rotateY(Math.random() * Math.PI * 2);
        this.add(bottom);


        // A Torus to represent the top hook
        const body = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(10, 1), 2, 2, 2),
            snowMaterial,
        );
        body.position.y += 22;
        body.castShadow = true;
        body.receiveShadow = true;
        body.rotateZ(Math.random() * Math.PI * 2);
        body.rotateY(Math.random() * Math.PI * 2);

        this.add(body);
        // A Torus to represent the top hook
        const head = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(7, 1), 2, 2, 2),
            snowMaterial,
        );
        head.name = 'head';
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
                    color: globalColors.carrot,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
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
                    color: globalColors.eye,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
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
                    color: globalColors.eye,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
            );
            console.log(username)

            eye2.position.y += 40;
            eye2.castShadow = true;
            eye2.receiveShadow = true;
            eye2.position.z += 4;
            eye2.position.x += 2;
            this.add(eye2);
            const loader = new THREE.FontLoader();
            const self = this;
            loader.load('font.json', (font) => {
                const usernameText = new THREE.TextGeometry(username, {
                    font,
                    size: 8,
                    height: 1,
                    curveSegments: 20,
                });
                const usernameMesh = new THREE.Mesh(
                    usernameText,
                    new THREE.MeshMatcapMaterial({
                        color: globalColors.green,
                    }),
                );
                usernameMesh.name = 'username';
                usernameMesh.position.y += 50;
                const size = new THREE.Box3().setFromObject(usernameMesh).getSize();
                usernameMesh.geometry.translate(-Math.floor(size.x / 2), 0, 0);
                self.add(usernameMesh);
                self.usernameMesh = usernameMesh;
            });
            const health = new THREE.Mesh(
                new THREE.BoxGeometry(40, 2, 2),
                new THREE.MeshMatcapMaterial({
                    color: 0xff0051,

                }),
            );
            health.name = 'health';
            health.position.y += 60;
            self.healthBar = health;
            self.add(health);

        }
        this.gun = new Gun(1, 7, 20, 35);
        // const gun = new THREE.Mesh(new THREE.BoxGeometry(1, 7/5, 20, 1, 1), new THREE.MeshPhongMaterial({ color: 0xffffff }));

        // this.gun.applyMatrix( new THREE.Matrix4().makeTranslation(-10, 30, 20) );
        this.gun.translateX(-10);
        this.gun.translateY(30);
        if (isMainCharacter) {
            this.gun.rotation.z = radians(180);
        } else {
            this.gun.rotation.y = radians(180);
        }
        // this.gun.rotation.x = radians(-1);
        this.add(this.gun)

    }

    rotateUserInfo(theta) {
        if (this.usernameMesh !== undefined && this.healthBar !== undefined) {
            // console.log(this.usernameMesh);
            // this.usernameMesh.position.y = 0;
            // this.usernameMesh.rotation.y = theta;
            // this.usernameMesh.position.y = 50;
            // this.usernameMesh.position.x = 0;
            //
            // const size = new THREE.Box3().setFromObject( this.usernameMesh ).getSize();
            // this.usernameMesh.position.x -= Math.floor(size['x'] / 2);
            // this.usernameMesh.position.x = 0;
            this.usernameMesh.position.z = 0;
            this.healthBar.position.x = 0;
            this.usernameMesh.rotation.y = theta - this.rotation.y - radians(180);
            this.healthBar.rotation.y = this.usernameMesh.rotation.y;
        }
    }

    receiveDamage(amount) {
        let death = false;
        if (this.health > 0) {
            this.health -= amount;
        } else {
            this.health = 100;
            death = true;
        }
        if (this.healthBar !== undefined) {
            this.healthBar.scale.x = this.health / 100;
        }
        return death;
    }
}

class Tree extends THREE.Group {
    constructor() {
        super();

        const trunkColor = '#ffaa00';
        const treeColors = ['#4d9e3a', '#36662b', '#2a7519', '#367727', '#d9e0d7'];
        const treeMaterial = new THREE.MeshPhongMaterial({
            color: treeColors[Math.floor(Math.random() * treeColors.length)],
            flatShading: THREE.FlatShading,
            refractionRatio: 0.25,
            reflectivity: 0.1,
        });

        const trunk = new THREE.Mesh(
            addNoise(new THREE.CylinderGeometry(20, 20, 20, 4), 2, 2, 2),
            new THREE.MeshPhongMaterial({
                color: trunkColor,
                flatShading: THREE.FlatShading,
                refractionRatio: 0.25,

            }),
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
        const bottom = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 50, 120, 18), 11, 11, 11), treeMaterial);
        bottom.position.y = 80;
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        this.add(bottom);
        const mid = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 40, 100, 17), 11, 11, 11), treeMaterial);
        mid.position.y = 110;
        mid.castShadow = true;
        mid.receiveShadow = true;
        this.add(mid);
        const top = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 30, 80, 14), 11, 11, 11), treeMaterial);
        top.position.y = 140;
        top.castShadow = true;
        top.receiveShadow = true;
        this.add(top);

        this.variation = (Math.random() - 0.5) - 0.1;

        this.scale.x = 1 + this.variation;
        this.scale.y = 1 + this.variation;
        this.scale.z = 1 + this.variation;
        this.rotation.y = Math.random() * Math.PI;
    }
}


class Gun extends THREE.Group {
    constructor(width, height, length, zOffset) {
        super();
        this.recoilAmount = radians(20);

        this.zOffset = zOffset;
        this.gun = new THREE.Group();
        this.makeGun(width, height, length, zOffset);
        this.add(this.gun)
        this.gun.position.z -= zOffset;

    }

    makeGun(width, height, length) {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(width, height / 5, length, 1, 1), new THREE.MeshPhongMaterial({color: 0xffffff}));
        this.gun.add(barrel);
        const handleHeight = 4 * height / 5;
        const handleLength = length / 10;
        const handle = new THREE.Mesh(new THREE.BoxGeometry(width, handleHeight, handleLength, 1, 1), new THREE.MeshPhongMaterial({color: 0xffffff}));
        handle.position.y = barrel.position.y - (handleHeight) / 2;
        handle.position.z += length / 2 - handleLength / 2;
        this.gun.add(handle);
        this.barrel = barrel;
        this.handle = handle;

    }

    recoil(timeout) {
        this.gun.position.z += this.zOffset;
        this.gun.rotation.x = this.recoilAmount;
        this.gun.position.z -= this.zOffset;
        setTimeout(() => {
            this.gun.rotation.x = 0
        }, timeout)
    }
}