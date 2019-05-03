onmessage = function(e) {
    const pCount= e.data[0][0];
    const particles= e.data[0][1];
    while (pCount--) {
        const particle = particles.vertices[pCount];
        if (pCount < 35000 && particle.y >= 10 && particle.y <= 11) {
            particle.velocity.y = 0;
            particle.velocity.x = 0;
        } else if (particle.y < 0) {
            particle.y = Math.random()*5000;
            particle.velocity.y = -0.5;
            particle.velocity.y -= Math.random() * 0.2;
            particle.velocity.x = -0.2 + Math.random() * 0.4;
        }

        particle.y += particle.velocity.y;
        particle.x += particle.velocity.x;
    }
    particles.verticesNeedUpdate = true;
    e.data[0]();
};
