const MAX_PATH_LENGTH = 1000;

let myId;
let entities = {};
let shadow = new Image();
let entityMap;

function updateEntities() {

    //console.log("*** Updating entities... ***");

    entityMap = [];
    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([]);
      }
      entityMap.push(row);
    }

    for (let id of Object.keys(entities)) {
        let entity = entities[id];

        if (isNaN(entity.currentX) || isNaN(entity.currentY) || entity.currentX === undefined || entity.currentY === undefined) {
            entity.currentX = entity.targetX;
            entity.currentY = entity.targetY;
        }

        if (worldTime >= entity.targetT) {

            if (entity.currentX != entity.targetX || entity.currentY != entity.targetY) {
                  entity.currentX = entity.targetX;
                  entity.currentY = entity.targetY;
              }

        } else if (lastClientTime !== undefined) {
        
            let deltaX = entity.targetX - entity.currentX;
            let deltaY = entity.targetY - entity.currentY;
            let tMinus = entity.targetT - worldTime;

            let frameLength = clientTime - lastClientTime;

            if (tMinus <= 0 || frameLength > tMinus) {
                entity.currentX = entity.targetX;
                entity.currentY = entity.targetY;
            } else if (frameLength >= 0 && tMinus > 0) {
                entity.currentX += frameLength * deltaX / tMinus;
                entity.currentY += frameLength * deltaY / tMinus;
            }

        }


        if (entity.image !== undefined && entity.image !== null && entity.image !== "") {

          let x = Math.floor(entity.currentX);
          let y = Math.floor(entity.currentY);
          let dy = entity.currentY - Math.floor(entity.currentY);
          if (dy > 0) y++;
          if (x >= 0 && x <= MAP_SIZE && y >= 0 && y <= MAP_SIZE) {
            entityMap[x][y].push(entity);
          }

        }

    }

    if (entities[myId] !== undefined) {
        if (cameraMouse) {
            if (cameraX < (entities[myId].currentX-w/128) - (w/64)/2.5) cameraX = (entities[myId].currentX-w/128) - (w/64)/2.5;
            if (cameraY < (entities[myId].currentY-h/96)  - (h/48)/3) cameraY = (entities[myId].currentY-h/96)  - (h/48)/3;
            if (cameraX > (entities[myId].currentX-w/128) + (w/64)/2.5) cameraX = (entities[myId].currentX-w/128) + (w/64)/2.5;
            if (cameraY > (entities[myId].currentY-h/96)  + (h/48)/3) cameraY = (entities[myId].currentY-h/96)  + (h/48)/3;
        } else {
            if (cameraX < (entities[myId].currentX-w/128) - (w/64)/4) cameraX = (entities[myId].currentX-w/128) - (w/64)/4;
            if (cameraY < (entities[myId].currentY-h/96)  - (h/48)/4) cameraY = (entities[myId].currentY-h/96)  - (h/48)/4;
            if (cameraX > (entities[myId].currentX-w/128) + (w/64)/4) cameraX = (entities[myId].currentX-w/128) + (w/64)/4;
            if (cameraY > (entities[myId].currentY-h/96)  + (h/48)/4) cameraY = (entities[myId].currentY-h/96)  + (h/48)/4;
        }
    }

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_SIZE-w/64) cameraX = MAP_SIZE-w/64;
    if (cameraY > MAP_SIZE-h/48) cameraY = MAP_SIZE-h/48;

}

function passableTile(x, y) {

    if (tileMap[x][y].length <= 1) return true;
    if (tileMap[x][y].length >= 3 && tileMap[x][y][1] === null && tileMap[x][y][2] === null) return true;

    return false;

}

function calculatePath(endX, endY) {

    let nodes = [];

    if (endX < 1 || endY < 1 || endX > MAP_SIZE-1 || endY > MAP_SIZE-1) return [];
    if (!passableTile(endX, endY)) return [];
    for (let id of Object.keys(entities)) {
        if (endX === entities[id].targetX && endY === entities[id].targetY) return [];
    }

    let adjacencies = [{x: 0, y:-1, g:10}, {x:  1, y:-1, g:14}, {x: 1, y:0, g:10}, {x: 1, y: 1, g:14},
                       {x: 0, y: 1, g:10}, {x: -1, y: 1, g:14}, {x:-1, y:0, g:10}, {x:-1, y:-1, g:14}];

    let startX = entities[myId].targetX;
    let startY = entities[myId].targetY;

    let dx = Math.abs(startX - endX);
    let dy = Math.abs(startY - endY);
    let d = (dx < dy ? dx : dy) * 14 + Math.abs(dx - dy) * 10;

    nodes = [{x:startX, y:startY, g:0, h:d, f:d, from: null, done: false, n:0}];

    search:
    for (let n = 1; n <= MAX_PATH_LENGTH; n++) {

        let current;
        let bestF = 999999;
        for (let node of nodes) {
            if (node.done) continue;
            if (node.f < bestF) {
                bestF = node.f;
                current = node;
            }
        }

        adjs:
        for (let adj of adjacencies) {

            let x = current.x + adj.x;
            let y = current.y + adj.y;

            if (x < 1 || y < 1 || x > MAP_SIZE-1 || y > MAP_SIZE-1) continue;

            if (!passableTile(x, y)) continue;
            if (adj.x !== 0 && adj.y !== 0) {
                if (!passableTile(current.x, y)) continue;
                if (!passableTile(x, current.y)) continue;
            }

            for (let id of Object.keys(entities)) {
                if (x === entities[id].targetX && y === entities[id].targetY) continue;
            }

            for (let node of nodes) {
                if (x === node.x && y === node.y) {
                    if (!node.done) {
                        let g = current.g + adj.g;
                        if (g < node.g) {
                            node.g = g;
                            node.from = current;
                            node.f = node.h + g;
                            node.n = n;
                        }
                    }
                    continue adjs;
                }
            }

            let hx = Math.abs(x - endX);
            let hy = Math.abs(y - endY);
            let h = (hx < hy ? hx : hy) * 14 + Math.abs(hx - hy) * 10;
            let g = current.g + adj.g;
            nodes.push({x, y, g, h, f:g+h, from: current, done: false, n});

            if (x === endX && y === endY) {
                let path = [];
                let node = nodes.pop();
                while (node != null) {
                    path.unshift(node);
                    node = node.from;
                }
                return path;
            }

        }

        current.done = true;

    }

    return [];

}
