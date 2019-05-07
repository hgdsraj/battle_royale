function makeNPCs(scene) {
    let npcs = [];
    let npcHandlers = [];
    for (let i = 0; i < 5; i ++) {
        let s = {};
        s['position'] = {'x': -1000 + Math.random() * 2000, 'y':15, 'z': -1000 + Math.random() * 2000};
        s['velocity'] = {'x': -3 + Math.random() * 6, 'z': -3 + Math.random() * 6};
        s['counter'] = 0;
        npcHandlers.push(new UserHandler("NPC"+ i.toString()));

        npcs.push(s);

    }

    let moveNPCs = function () {

        let nCount = npcs.length;
        while (nCount--) {
            let npc = npcs[nCount];
            npcHandlers[nCount].send(npc['position']['x'], npc['position']['y'], npc['position']['z'], Math.random() * 3.14, 100, {}, '' ,Math.random() > 0.9 && nCount === 1);

            if (npc['position']['z'] < 2000 && npc['position']['z'] > -2000 && npc['position']['x'] < 2000 && npc['position']['x'] > -2000) {
                if (npc['counter'] > 100) {
                    npc['velocity']['z'] =  -2 + Math.random() * 2;
                    npc['velocity']['x'] =  -2 + Math.random() * 2;
                    if (Math.abs(npc['velocity']['x']) < 1 || Math.abs(npc['velocity']['y']) < 1) {
                        npc['velocity']['z'] =  0;
                        npc['velocity']['x'] = 0;

                    }
                    npc['counter'] = 0;
                } else {
                    npc['counter'] = npc['counter'] + 1;
                }
            } else {
                npc['position']['z'] = 0;
                npc['position']['x'] = 0;
            }

            npc['position']['z'] += npc['velocity']['z'];
            npc['position']['x'] += npc['velocity']['x'];
            npc.verticesNeedUpdate = true;

        }
        window.requestIdleCallback(moveNPCs, {'timeout': 100})

    };
    moveNPCs();
}
