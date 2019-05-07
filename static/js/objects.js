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
        const geometry = new THREE.PlaneBufferGeometry(1, 1);
        const verticalMirror = new THREE.Reflector(geometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x889999,
            recursion: 1,
        });
        const mirrorBase = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 1.6, 0.03),
            new THREE.MeshStandardMaterial({
                color: 0x6f7c7c,
                flatShading: THREE.FlatShading,
                metalness: 0,
                roughness: 0.8,
                refractionRatio: 0.25,

            }),
        );
        mirrorBase.castShadow = true;
        mirrorBase.position.z += 0.03;
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
                new THREE.BoxGeometry(width, height, 0.03),
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
            const doorWidth = 0.5;
            const doorHeight = 1;
            const doorWidthDividedBy2 = doorWidth / 2;
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(width / 2 - doorWidthDividedBy2, doorHeight, 0.03),
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
                new THREE.BoxGeometry(width / 2 - doorWidthDividedBy2, doorHeight, 0.03),
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
                new THREE.BoxGeometry(width, height - doorHeight, 0.03),
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
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(width, length, 0.01, 1), new THREE.MeshPhongMaterial({color: color}));
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
            new THREE.BoxGeometry(width, length, 0.03),
            new THREE.MeshStandardMaterial({
                color: 0x6f7c7c,
                flatShading: THREE.FlatShading,
                metalness: 0,
                roughness: 0.8,
                refractionRatio: 0.25,

            }),
        );
        material.position.z += 0.03;
        material.rotateY(radians(180));
        material.rotateX(radians(angle));
        this.add(material);
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;
        material.position.z += 0.03;
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
            addNoise(new THREE.OctahedronGeometry(0.17, 1), 0.02, 0.02, 0.02),
            snowMaterial,
        );
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        bottom.rotateZ(Math.random() * Math.PI * 2);
        bottom.rotateY(Math.random() * Math.PI * 2);
        this.add(bottom);


        // A Torus to represent the top hook
        const body = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(0.10, 1), 0.02, 0.02, 0.02),
            snowMaterial,
        );
        body.position.y += 0.22;
        body.castShadow = true;
        body.receiveShadow = true;
        body.rotateZ(Math.random() * Math.PI * 2);
        body.rotateY(Math.random() * Math.PI * 2);

        this.add(body);
        // A Torus to represent the top hook
        const head = new THREE.Mesh(
            addNoise(new THREE.OctahedronGeometry(0.07, 1), 0.02,0.02, 0.02),
            snowMaterial,
        );
        head.name = 'head';
        head.isHead = true;
        head.position.y += 0.37;
        head.castShadow = true;
        head.receiveShadow = true;
        head.rotateZ(Math.random() * Math.PI * 2);
        head.rotateY(Math.random() * Math.PI * 2);

        this.head = head;
        this.add(this.head);
        if (!noFace) {
            const nose = new THREE.Mesh(
                new THREE.ConeGeometry(0.02, 0.10),
                new THREE.MeshStandardMaterial({
                    color: globalColors.carrot,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
            );
            nose.position.y += 0.37;
            nose.castShadow = true;
            nose.receiveShadow = true;
            nose.rotateZ(radians(90));
            nose.rotateX(radians(getRandomInt(60, 90)));
            nose.position.z += 0.07;
            nose.isHead = true;
            this.add(nose);

            const eye1 = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 10, 32),
                new THREE.MeshStandardMaterial({
                    color: globalColors.eye,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
            );
            eye1.position.y += 0.40;
            eye1.castShadow = true;
            eye1.receiveShadow = true;
            eye1.position.z += 0.04;
            eye1.position.x -= 0.02;
            eye1.isHead = true;
            this.add(eye1);
            const eye2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 10, 32),
                new THREE.MeshStandardMaterial({
                    color: globalColors.eye,
                    flatShading: THREE.FlatShading,
                    metalness: 0,
                    roughness: 0.8,
                    refractionRatio: 0.25,

                }),
            );
            console.log(username)

            eye2.position.y += 0.40;
            eye2.castShadow = true;
            eye2.receiveShadow = true;
            eye2.position.z += 0.04;
            eye2.position.x += 0.02;
            eye2.isHead = true;
            this.add(eye2);
            const loader = new THREE.FontLoader();
            const self = this;
            loader.load('font.json', (font) => {
                const usernameText = new THREE.TextGeometry(username, {
                    font,
                    size: 0.08,
                    height: 0.01,
                    curveSegments: 20,
                });
                const usernameMesh = new THREE.Mesh(
                    usernameText,
                    new THREE.MeshMatcapMaterial({
                        color: globalColors.green,
                    }),
                );
                usernameMesh.name = 'username';
                usernameMesh.position.y += 0.50;
                const size = new THREE.Box3().setFromObject(usernameMesh).getSize();
                usernameMesh.geometry.translate(-size.x / 2, 0, 0);
                self.add(usernameMesh);
                self.usernameMesh = usernameMesh;
            });
            const health = new THREE.Mesh(
                new THREE.BoxGeometry(0.40, 0.02, 0.02),
                new THREE.MeshMatcapMaterial({
                    color: 0xff0051,

                }),
            );
            health.name = 'health';
            health.position.y += 0.60;
            self.healthBar = health;
            self.add(health);

        }
        this.gun = new Gun(0.01, 0.07, 0.20, 0.25);
        // const gun = new THREE.Mesh(new THREE.BoxGeometry(1, 7/5, 20, 1, 1), new THREE.MeshPhongMaterial({ color: 0xffffff }));

        // this.gun.applyMatrix( new THREE.Matrix4().makeTranslation(-10, 30, 20) );
        this.gun.translateX(-0.15);
        this.gun.translateY(0.30);
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
        this.health -= amount;
        if (this.health <= 0) {
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
            addNoise(new THREE.CylinderGeometry(0.20, 0.20, 0.20, 4), 0.002, 0.002, 0.002),
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

        trunk.position.y = 0.10;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.add(trunk);
        const bottom = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 0.50, 1.20, 18), 0.11, 0.11, 0.11), treeMaterial);
        bottom.position.y = 0.80;
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        this.add(bottom);
        const mid = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 0.40, 1.00, 17), 0.11, 0.11, 0.11), treeMaterial);
        mid.position.y = 1.10;
        mid.castShadow = true;
        mid.receiveShadow = true;
        this.add(mid);
        const top = new THREE.Mesh(addNoise(new THREE.CylinderGeometry(0, 0.30, 0.80, 14), 0.11, 0.11, 0.11), treeMaterial);
        top.position.y = 1.40;
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
        const underbarrel = new THREE.Mesh(new THREE.BoxGeometry(width, height / 5, length, 1, 1), new THREE.MeshPhongMaterial({color: 0x8a9a5b}));
        this.gun.add(underbarrel);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(width, width, length*2), new THREE.MeshPhongMaterial({color: 0x000000}));
        barrel.rotation.x = radians(90);
        barrel.position.y += underbarrel.position.y + width;
        barrel.position.z -= length/2;
        this.gun.add(barrel);

        const scopeBack = new THREE.Mesh(new THREE.CylinderGeometry(width*2, width, length/2), new THREE.MeshPhongMaterial({color: 0x000000}));
        scopeBack.rotation.x = radians(90);
        scopeBack.position.y += barrel.position.y + 4*width;
        scopeBack.position.z += length/2 - 0.1;
        this.gun.add(scopeBack);

        const scopeFront = new THREE.Mesh(new THREE.CylinderGeometry(width, width*1.5, length/2), new THREE.MeshPhongMaterial({color: 0x000000}));
        scopeFront.rotation.x = radians(90);
        scopeFront.position.y += barrel.position.y + 4*width;
        scopeFront.position.z -= 0.1;

        this.gun.add(scopeFront);

        const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(width, height/3, length/3, 1, 1), new THREE.MeshPhongMaterial({color: 0x8a9a5b}));
        scopeMount.position.y += barrel.position.y + 2*width;
        scopeMount.position.z -= 0.1/2;

        this.gun.add(scopeMount);

        // scopeFront.position.z -= length;

        const handleHeight = 4 * height / 5;
        const handleLength = length / 10;
        const handle = new THREE.Mesh(new THREE.BoxGeometry(width, handleHeight, handleLength, 1, 1), new THREE.MeshPhongMaterial({color: 0x8a9a5b}));
        handle.position.y = underbarrel.position.y - (handleHeight) / 2;
        handle.position.z += length / 2 - handleLength / 2;
        this.gun.add(handle);
        this.underbarrel = underbarrel;
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