function normalized(x, mapSize) {
    let val =  (x - -mapSize) / (mapSize - -mapSize);

    if (val > 1) {
        return 1
    } else if (val < 0) {
        return 0
    }
    return val
}

onmessage = function(e) {
    const keys = Object.keys(e.data['enemies']);
    let html = '';
    const mapSize = e.data['mapSize'];
    const username = e.data['username'];
    const width = e.data['width'];
    const height = e.data['height'];
    const offset = e.data['offset'];
    for (let i = 0; i < keys.length; i++) {
        const enemy = e.data['enemies'][keys[i]];
        let addedClasses = '';
        if (enemy.username === username) {
            addedClasses = 'friendly-arrow';
        }
        html += `<i class="hud arrow ${addedClasses}" style="transform: rotate(${-enemy.theta* 180.0 / Math.PI + 45}deg); left: ${normalized(enemy.x, mapSize)*width + offset}px; top: ${normalized(enemy.z, mapSize)*height + offset}px"> </i>`

    }
    postMessage(html);
};

