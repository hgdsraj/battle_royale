/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

THREE.PointerLockControls = function (camera, domElement) {
    const scope = this;

    this.domElement = domElement || document.body;
    this.isLocked = false;

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');

    const PI_2 = Math.PI / 2;

    function onMouseMove(event) {
        if (scope.isLocked === false) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        euler.setFromQuaternion(camera.quaternion);

        euler.y -= movementX * 0.002;
        euler.x -= movementY * 0.002;

        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));

        camera.quaternion.setFromEuler(euler);
    }

    function onPointerlockChange() {
        if (document.pointerLockElement === self.domElement) {
            self.dispatchEvent({ type: 'lock' });

            self.isLocked = true;
        } else {
            self.dispatchEvent({ type: 'unlock' });

            self.isLocked = false;
        }
    }

    function onPointerlockError() {
        console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
    }

    this.connect = function () {
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('pointerlockchange', onPointerlockChange, false);
        document.addEventListener('pointerlockerror', onPointerlockError, false);
    };

    this.disconnect = function () {
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('pointerlockchange', onPointerlockChange, false);
        document.removeEventListener('pointerlockerror', onPointerlockError, false);
    };

    this.dispose = function () {
        this.disconnect();
    };

    this.getObject = function () { // retaining this method for backward compatibility
        return camera;
    };

    this.getDirection = (function () {
        const direction = new THREE.Vector3(0, 0, -1);

        return function (v) {
            return v.copy(direction).applyQuaternion(camera.quaternion);
        };
    }());

    this.lock = function () {
        document.requestPointerLock();
    };

    this.unlock = function () {
        document.exitPointerLock();
    };

    this.connect();
};

THREE.PointerLockControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.PointerLockControls.prototype.constructor = THREE.PointerLockControls;
