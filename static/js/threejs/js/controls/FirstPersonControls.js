/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author rmahey / http://rajmahey.com/
 */

THREE.FirstPersonControls = function (object, domElement) {
    const self = this;
    self.object = object;
    self.euler = new THREE.Euler( 0, 0, 0, 'YXZ' );

    var PI_2 = Math.PI / 2;

    self.isLocked = false;

    self.domElement = (domElement !== undefined) ? domElement : document;
    self.targetPosition = {};
    self.position = {};
    self.enabled = false;

    self.movementSpeed = 1.0;
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

    self.autoSpeedFactor = 0.0;

    self.mouseX = 0;
    self.mouseY = 0;

    self.moveForward = false;
    self.moveBackward = false;
    self.moveLeft = false;
    self.moveRight = false;

    self.mouseDragOn = true;
    self.jump = false;
    self.jumpStepsPosition = 0;
    self.jumpSteps = [1, 0.9, 0.9, 0.9, 0.6, 0.5, 0.5, 0.3, 0.3, 0.2, 0.2, 0.1, 0.1,0.1, 0.1,0.1, 0.1, 0, -0.1, -0.1,-0.1, -0.1,-0.1, -0.1, -0.2, -0.2, -0.3, -0.3, -0.5, -0.5, -0.6, -0.9, -0.9, -0.9, -1].map(function (x) {
        return x * 20;
    });

    self.viewHalfX = 0;
    self.viewHalfY = 0;

    // private variables

    var lat = 0;
    var lon = 0;

    var lookDirection = new THREE.Vector3();
    var spherical = new THREE.Spherical();
    var target = new THREE.Vector3();

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

    };

    self.onMouseUp = function (event) {

        self.activeLook = true;


        self.mouseDragOn = true;

    };

    self.onMouseMove = function (event) {

        if ( self.isLocked === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        self.euler.setFromQuaternion( camera.quaternion );

        self.euler.y -= movementX * 0.002;
        self.euler.x -= movementY * 0.002;

        self.euler.x = Math.max( - PI_2, Math.min( PI_2, self.euler.x ) );

        camera.quaternion.setFromEuler( self.euler );


    };
    function onPointerlockChange() {
        self.isLocked = document.pointerLockElement === domElement;
        self.enabled = self.isLocked;
        console.log("wuddup", self.isLocked);

    }

    function onPointerlockError() {

        console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

    }


    self.onKeyDown = function (event) {
        //event.preventDefault();

        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/
                self.moveForward = true;
                break;

            case 37: /*left*/
            case 65: /*A*/
                self.moveLeft = true;
                break;

            case 40: /*down*/
            case 83: /*S*/
                self.moveBackward = true;
                break;

            case 39: /*right*/
            case 68: /*D*/
                self.moveRight = true;
                break;

            case 82: /*R*/
                self.moveUp = true;
                break;
            case 70: /*F*/
                self.moveDown = true;
                break;
            case 32: /*space*/
                self.jump = true;
                break;


        }

    };

    self.onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/
                self.moveForward = false;
                break;

            case 37: /*left*/
            case 65: /*A*/
                self.moveLeft = false;
                break;

            case 40: /*down*/
            case 83: /*S*/
                self.moveBackward = false;
                break;

            case 39: /*right*/
            case 68: /*D*/
                self.moveRight = false;
                break;

            case 82: /*R*/
                self.moveUp = false;
                break;
            case 70: /*F*/
                self.moveDown = false;
                break;

            // case 32: /*space*/ self.jump = false; break;

        }

    };

    self.lookAt = function (x, y, z) {

        if (x.isVector3) {

            target.copy(x);

        } else {

            target.set(x, y, z);

        }

        self.object.lookAt(target);
        setOrientation(self);

        return self;

    };

    self.update = function () {


        return function update(delta) {

            if (self.enabled === false) return;

            if (self.heightSpeed) {

                var y = THREE.Math.clamp(self.object.position.y, self.heightMin, self.heightMax);
                var heightDelta = y - self.heightMin;

                self.autoSpeedFactor = delta * (heightDelta * self.heightCoef);

            } else {

                self.autoSpeedFactor = 0.0;

            }
            var actualMoveSpeed = delta * self.movementSpeed;
            if (self.jump) {
                if (self.jumpStepsPosition < self.jumpSteps.length) {
                    self.object.position.y += self.jumpSteps[self.jumpStepsPosition];
                    if (self.object.position.y < self.initialY) {
                        self.object.position.y = self.initialY;
                        self.jump = false;
                        self.jumpStepsPosition = 0;

                    }
                    self.jumpStepsPosition += 1;
                } else {
                    self.jump = false;
                    self.jumpStepsPosition = 0;
                }
            }

            if (self.moveForward || (self.autoForward && !self.moveBackward)) {
                self.object.translateZ(-(actualMoveSpeed + self.autoSpeedFactor));
                if (!self.jump) {
                    self.object.position.y = self.initialY;
                }
            }
            if (self.moveBackward) {
                self.object.translateZ(actualMoveSpeed);
                if (!self.jump) {
                    self.object.position.y = self.initialY;
                }
            }
            if (self.jumpOver) {
                self.object.position.y -= 10;
                self.jumpOver = false;

            }

            if (self.moveLeft) self.object.translateX(-actualMoveSpeed);
            if (self.moveRight) self.object.translateX(actualMoveSpeed);

            if (self.moveUp) self.object.translateY(actualMoveSpeed);
            if (self.moveDown) self.object.translateY(-actualMoveSpeed);
        };

    }();

    function contextmenu(event) {

        event.preventDefault();

    }
    self.dispose = function () {

        self.domElement.removeEventListener('contextmenu', contextmenu, false);
        self.domElement.removeEventListener('mousedown', _onMouseDown, false);
        self.domElement.removeEventListener('mousemove', _onMouseMove, false);
        self.domElement.removeEventListener('mouseup', _onMouseUp, false);
        document.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
        document.removeEventListener( 'pointerlockerror', onPointerlockError, false );

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
    document.addEventListener( 'pointerlockchange', onPointerlockChange, false );
    document.addEventListener( 'pointerlockerror', onPointerlockError, false );

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup', _onKeyUp, false);

    function bind(scope, fn) {

        return function () {

            fn.apply(scope, arguments);

        };

    }

    function setOrientation(controls) {

        var quaternion = controls.object.quaternion;

        lookDirection.set(0, 0, -1).applyQuaternion(quaternion);
        spherical.setFromVector3(lookDirection);

        lat = 90 - THREE.Math.radToDeg(spherical.phi);
        lon = THREE.Math.radToDeg(spherical.theta);

    }


    self.handleResize();

    setOrientation(self);

};
