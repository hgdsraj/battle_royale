

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


function getRandomInt(min, max) {
    return Math.floor(Math.random() * Math.floor(max - min) + min);
}

function calculateCollisionPoints( group ) {
    // Compute the bounding box after scale, translation, etc.
    let results = [];
    const position = group.position;
    for (let i =0; i < group.children.length; i++ ) {
        results = results.concat(group.children[i])
        results[results.length-1].position = position
    }
    return results
}
function detectCollisions(userCharacter, collisionObjects) {
    var originPoint = userCharacter.position.clone();
    for (var vertexIndex = 0; vertexIndex < userCharacter.geometry.vertices.length; vertexIndex++) {
        var localVertex = userCharacter.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(userCharacter.matrix);
        var directionVector = globalVertex.sub(userCharacter.position);
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(collisionObjects);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            console.log(collisionResults[0].object.name);
            // collisionResults[0].object.material.transparent = true;
            // collisionResults[0].object.material.opacity = 0.4;
        }
    }
}
