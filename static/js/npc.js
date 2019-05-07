function makeNPCs(scene) {
    let npcs = [];
    for (let i = 0; i < 5; i ++) {
        let s = new Character('');
        s.position.set(-1000 + Math.random() * 2000, 15, -1000 + Math.random() * 2000);
        npcs.push(s);
        s.velocity = {'x': 0, 'z': 0};
        s.velocity.z = -3 + Math.random() * 6;
        s.velocity.x = -3 + Math.random() * 6;

        s.counter = 0;
        scene.add(s);

    }

    let moveNPCs = function (userHandler) {

        let nCount = npcs.length;
        while (nCount--) {
            let npc = npcs[nCount];
            userHandler.sendNPC(npc.position.x, npc.position.y, npc.position.z, npc.rotation.y, npc.health, {}, '' ,Math.random() > 0.9 && nCount === 1, "NPC" + nCount.toString());

            if (npc.position.z < 2000 && npc.position.z > -2000 && npc.position.x < 2000 && npc.position.x > -2000) {
                if (npc.counter > 100) {
                    npc.velocity.z =  -2 + Math.random() * 2;
                    npc.velocity.x =  -2 + Math.random() * 2;
                    if (Math.abs(npc.velocity.x) < 1 || Math.abs(npc.velocity.y) < 1) {
                        npc.velocity.z =  0;
                        npc.velocity.x = 0;

                    }
                    npc.counter = 0;
                } else {
                    npc.counter = npc.counter + 1;
                }
            } else {
                npc.position.z = 0;
                npc.position.x = 0;
            }

            npc.position.z += npc.velocity.z;
            npc.position.x += npc.velocity.x;
            npc.verticesNeedUpdate = true;

        }

    };
    return moveNPCs;
}
