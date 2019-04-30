

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
        const v = geometry.vertices[i];
        v.x += -noiseX / 2 + Math.random() * noiseX;
        v.y += -noiseY / 2 + Math.random() * noiseY;
        v.z += -noiseZ / 2 + Math.random() * noiseZ;
    }

    return geometry;
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * Math.floor(max - min) + min);
}

function calculateCollisionPoints(group) {
    // // Compute the bounding box after scale, translation, etc.
    // let results = [];
    // const position = group.position;
    // for (let i =0; i < group.children.length; i++ ) {
    //     const child = group.children[i].clone();
    //     child.parent = group.children[i].parent.clone();
    //     child.matrix = group.children[i].matrix;
    //     child.position.add(position);
    //     results.push(child); //TODO: this should be children[i].clone() but it doesn't work! why?
    // }
    return group.children;
}
function detectCollisions(userCharacter, collisionObjects) {
    const collisions = [];
    for (let vertexIndex = 0; vertexIndex < userCharacter.geometry.vertices.length; vertexIndex++) {
        const localVertex = userCharacter.geometry.vertices[vertexIndex].clone();
        const globalVertex = localVertex.applyMatrix4(userCharacter.matrix);
        const directionVector = globalVertex.sub(userCharacter.position);

        const ray = new THREE.Raycaster(userCharacter.position, directionVector.clone().normalize());
        const collisionResults = ray.intersectObjects(collisionObjects);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            collisions.push([collisionResults[0].distance - directionVector.length(), directionVector]);
        }
    }
    return collisions;
}

function detectBullets(position, vector, collisionObjects) {
    const ray = new THREE.Raycaster(position, vector.clone().normalize());
    return ray.intersectObjects(collisionObjects);
}
