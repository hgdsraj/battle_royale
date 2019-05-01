/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author rmahey / http://rajmahey.com/
 */

THREE.FirstPersonControls = function (camera, domElement) {
    const self = this;
    self.camera = camera;
    self.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    self.recoilUp = true;
    const PI_2 = Math.PI / 2;

    self.isLocked = false;

    self.allowNegativeXMovement = true;
    self.allowNegativeYMovement = true;
    self.allowNegativeZMovement = true;
    self.allowPositiveXMovement = true;
    self.allowPositiveYMovement = true;
    self.allowPositiveZMovement = true;

    self.domElement = (domElement !== undefined) ? domElement : document;
    self.targetPosition = {};
    self.position = {};
    self.enabled = false;

    self.movementSpeed = 10;
    self.lookSpeed = 0.005;

    self.lookVertical = true;
    self.autoForward = false;

    self.activeLook = true;

    self.heightSpeed = false;
    self.heightCoef = 1.0;
    self.heightMin = 0.0;
    self.heightMax = 1.0;

    self.constrainVertical = false;
    self.verticalMin = 0;
    self.verticalMax = Math.PI;


    self.mouseX = 0;
    self.mouseY = 0;

    self.moveForward = false;
    self.moveBackward = false;
    self.moveLeft = false;
    self.moveRight = false;

    self.mouseDragOn = true;
    self.jump = false;
    self.initialJumpVelocity = 20;
    self.initialGravityVelocity = 0;
    self.gravityVelocity = self.initialGravityVelocity;
    self.jumpVelocity = self.initialJumpVelocity;
    // self.jumpStepsPosition = 0;
    // self.jumpSteps = [1, 0.9, 0.9, 0.9, 0.6, 0.5, 0.5, 0.3, 0.3, 0.2, 0.2, 0.1, 0.1,0.1, 0.1,0.1, 0.1, 0, -0.1, -0.1,-0.1, -0.1,-0.1, -0.1, -0.2, -0.2, -0.3, -0.3, -0.5, -0.5, -0.6, -0.9, -0.9, -0.9, -1].map(function (x) {
    //     return x * 20;
    // });

    self.viewHalfX = 0;
    self.viewHalfY = 0;
    self.movements = [];
    // private variables

    let lat = 0;
    let lon = 0;

    const lookDirection = new THREE.Vector3();
    const spherical = new THREE.Spherical();
    const target = new THREE.Vector3();

    //

    if (self.domElement !== document) {
        self.domElement.setAttribute('tabindex', -1);
    }

    //
    if (self.domElement !== document) {
        self.domElement.focus();
    }

    self.handleResize = function () {
        if (self.domElement === document) {
            self.viewHalfX = window.innerWidth / 2;
            self.viewHalfY = window.innerHeight / 2;
        } else {
            self.viewHalfX = self.domElement.offsetWidth / 2;
            self.viewHalfY = self.domElement.offsetHeight / 2;
        }
    };

    self.onMouseDown = function (event) {
        if (self.domElement !== document) {
            self.domElement.focus();
        }

        self.activeLook = true;

        self.mouseDragOn = true;
        self.shooting = true;
    };

    self.onMouseUp = function (event) {
        self.activeLook = true;


        self.mouseDragOn = true;
    };

    self.onMouseMove = function (event) {
        if (self.isLocked === false) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        self.euler.setFromQuaternion(camera.quaternion);

        self.euler.y -= movementX * 0.002;
        self.euler.x -= movementY * 0.002;

        self.euler.x = Math.max(-PI_2, Math.min(PI_2, self.euler.x));

        camera.quaternion.setFromEuler(self.euler);
    };

    self.recoil = function () {
        if (self.recoilUp) {
            self.euler.x += 0.04;
            self.recoilUp = false;
        } else {
            self.euler.x -= 0.03;
            self.recoilUp = true;
        }
        self.euler.x = Math.max(-PI_2, Math.min(PI_2, self.euler.x));
        camera.quaternion.setFromEuler(self.euler);
    };

    function onPointerlockChange() {
        self.isLocked = document.pointerLockElement === domElement;
        self.enabled = self.isLocked;
        console.log('wuddup', self.isLocked);
    }

    function onPointerlockError() {
        console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
    }

    self.pushMovement = function (movement) {
        if (self.movements.length === 1) {
            self.movements.shift();
        }
        self.movements.push(movement);
    };
    self.undoMovement = function () {
        self.movements.forEach((el) => {
            if ('x' in el) {
                self.camera.translateX(-el.x);
            } else if ('y' in el) {
                self.camera.translateY(-el.y);
            } else if ('z' in el) {
                self.camera.translateZ(-el.z);
            }
        });
    };
    self.dontAllowMovement = function (direction) {
        self.allowAllMovements();
        if (direction.x < 0) {
            self.allowNegativeXMovement = false;
        } else if (direction.x > 0) {
            self.allowPositiveXMovement = false;
        }
        if (direction.y < 0) {
            self.allowNegativeYMovement = false;
        } else if (direction.y > 0) {
            self.allowPositiveYMovement = false;
        }
        if (direction.z < 0) {
            self.allowNegativeZMovement = false;
        } else if (direction.z > 0) {
            self.allowPositiveZMovement = false;
        }
    };
    self.allowAllMovements = function () {
        self.allowNegativeXMovement = true;
        self.allowNegativeYMovement = true;
        self.allowNegativeZMovement = true;
        self.allowPositiveXMovement = true;
        self.allowPositiveYMovement = true;
        self.allowPositiveZMovement = true;
    };

    self.onKeyDown = function (event) {
        // event.preventDefault();

        switch (event.keyCode) {
            case 38: /* up */
            case 87: /* W */
                self.moveForward = true;
                break;

            case 37: /* left */
            case 65: /* A */
                self.moveLeft = true;
                break;

            case 40: /* down */
            case 83: /* S */
                self.moveBackward = true;
                break;

            case 39: /* right */
            case 68: /* D */
                self.moveRight = true;
                break;

            case 82: /* R */
                self.moveUp = true;
                break;
            case 70: /* F */
                self.moveDown = true;
                break;
            case 32: /* space */
                self.jump = true;
                break;
        }
    };

    self.onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: /* up */
            case 87: /* W */
                self.moveForward = false;
                break;

            case 37: /* left */
            case 65: /* A */
                self.moveLeft = false;
                break;

            case 40: /* down */
            case 83: /* S */
                self.moveBackward = false;
                break;

            case 39: /* right */
            case 68: /* D */
                self.moveRight = false;
                break;

            case 82: /* R */
                self.moveUp = false;
                break;
            case 70: /* F */
                self.moveDown = false;
                break;

            // case 32: /*space*/ self.jump = false; break;
        }
    };


    self.update = (function () {
        return function update(delta) {
            if (self.enabled === false) return;

            const actualMoveSpeed = delta * self.movementSpeed;
            if (self.jump && self.allowPositiveYMovement && self.jumpVelocity > 0) {
                self.camera.position.y += self.jumpVelocity;
                self.jumpVelocity -= 1;
                self.pushMovement({ y: self.jumpVelocity });
            } else if (self.allowNegativeYMovement && self.camera.position.y > self.initialY) {
                self.camera.position.y -= self.gravityVelocity;
                self.gravityVelocity += 1;
                self.pushMovement({ y: -self.gravityVelocity });
            } else {
                self.gravityVelocity = self.initialGravityVelocity;
                self.jumpVelocity = self.initialJumpVelocity;
                self.jump = false;
            }


            if (self.moveForward && self.allowNegativeZMovement) {
                self.camera.translateZ(-actualMoveSpeed);
                self.pushMovement({ z: -actualMoveSpeed });
            }

            if (self.moveBackward && self.allowPositiveZMovement) {
                self.camera.translateZ(actualMoveSpeed);
                self.pushMovement({ z: actualMoveSpeed });
            }

            if (self.camera.position.y < self.initialY) {
                self.camera.position.y = self.initialY;
                self.jump = false;
            }

            if (self.moveLeft && self.allowNegativeXMovement) {
                self.camera.translateX(-actualMoveSpeed);
                self.pushMovement({ x: -actualMoveSpeed });
            }
            if (self.moveRight && self.allowPositiveXMovement) {
                self.camera.translateX(actualMoveSpeed);
                self.pushMovement({ x: actualMoveSpeed });
            }

            if (self.moveUp && self.allowPositiveYMovement) {
                self.camera.translateY(actualMoveSpeed*10);
                self.pushMovement({ y: actualMoveSpeed*10 });
            }
            if (self.moveDown && self.allowNegativeYMovement) {
                self.camera.translateY(-actualMoveSpeed*10);
                self.pushMovement({ y: -actualMoveSpeed *10});
            }
        };
    }());

    function contextmenu(event) {
        event.preventDefault();
    }
    self.dispose = function () {
        self.domElement.removeEventListener('contextmenu', contextmenu, false);
        self.domElement.removeEventListener('mousedown', _onMouseDown, false);
        self.domElement.removeEventListener('mousemove', _onMouseMove, false);
        self.domElement.removeEventListener('mouseup', _onMouseUp, false);
        document.removeEventListener('pointerlockchange', onPointerlockChange, false);
        document.removeEventListener('pointerlockerror', onPointerlockError, false);

        window.removeEventListener('keydown', _onKeyDown, false);
        window.removeEventListener('keyup', _onKeyUp, false);
    };

    var _onMouseMove = bind(self, self.onMouseMove);
    var _onMouseDown = bind(self, self.onMouseDown);
    var _onMouseUp = bind(self, self.onMouseUp);
    var _onKeyDown = bind(self, self.onKeyDown);
    var _onKeyUp = bind(self, self.onKeyUp);

    self.domElement.addEventListener('contextmenu', contextmenu, false);
    self.domElement.addEventListener('mousemove', _onMouseMove, false);
    self.domElement.addEventListener('mousedown', _onMouseDown, false);
    self.domElement.addEventListener('mouseup', _onMouseUp, false);
    document.addEventListener('pointerlockchange', onPointerlockChange, false);
    document.addEventListener('pointerlockerror', onPointerlockError, false);

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup', _onKeyUp, false);

    function bind(scope, fn) {
        return function () {
            fn.apply(scope, arguments);
        };
    }

    function setOrientation(controls) {
        const quaternion = controls.camera.quaternion;

        lookDirection.set(0, 0, -1).applyQuaternion(quaternion);
        spherical.setFromVector3(lookDirection);

        lat = 90 - THREE.Math.radToDeg(spherical.phi);
        lon = THREE.Math.radToDeg(spherical.theta);
    }


    self.handleResize();

    setOrientation(self);
};
