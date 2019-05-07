function makeNPCs(scene) {
    let npcs = [];
    let npcHandlers = [];
    for (let i = 0; i < 5; i ++) {
        let s = {};
        s['position'] = {'x': -10 + Math.random() * 20, 'y':0.15, 'z': -10 + Math.random() * 20};
        s['velocity'] = {'x': -0.03 + Math.random() * 0.06, 'z': -0.03 + Math.random() * 0.06};
        s['counter'] = 0;
        npcHandlers.push(new UserHandler("NPC"+ i.toString()));

        npcs.push(s);

    }

    let moveNPCs = function () {

        let nCount = npcs.length;
        while (nCount--) {
            let npc = npcs[nCount];
            npcHandlers[nCount].send(npc['position']['x'], npc['position']['y'], npc['position']['z'], Math.random() * 3.14, 100, {}, '' ,Math.random() > 0.9 && nCount === 1);

            if (npc['position']['z'] < 20 && npc['position']['z'] > -20 && npc['position']['x'] < 20 && npc['position']['x'] > -20) {
                if (npc['counter'] > 1) {
                    npc['velocity']['z'] =  -0.02 + Math.random() * 0.02;
                    npc['velocity']['x'] =  -0.02 + Math.random() * 0.02;
                    if (Math.abs(npc['velocity']['x']) < 0.01 || Math.abs(npc['velocity']['y']) < 0.01) {
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
