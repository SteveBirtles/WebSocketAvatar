const moveTime = 200;
const chatLifespan = 5000;

const MAX_PATH_LENGTH = 1000;

let myId;
let avatars = {};
let shadow = new Image();
let avatarMap;

function updateAvatars() {

    //console.log("*** Updating avatars... ***");

    avatarMap = [];
    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([]);
      }
      avatarMap.push(row);
    }

    for (let id of Object.keys(avatars)) {
        let avatar = avatars[id];

        if (isNaN(avatar.currentX) || isNaN(avatar.currentY) || avatar.currentX === undefined || avatar.currentY === undefined) {
            avatar.currentX = avatar.targetX;
            avatar.currentY = avatar.targetY;
        }

        if (worldTime >= avatar.targetT &&
            (avatar.currentX != avatar.targetX ||
              avatar.currentY != avatar.targetY)) {

            avatar.currentX = avatar.targetX;
            avatar.currentY = avatar.targetY;

        } else if (lastClientTime !== undefined) {

            let dx = (avatar.targetX - avatar.currentX) / (avatar.targetT - worldTime);
            let dy = (avatar.targetY - avatar.currentY) / (avatar.targetT - worldTime);
            let dt = clientTime - lastClientTime;

            if (!isNaN(dx)) avatar.currentX += dx * dt;
            if (!isNaN(dy)) avatar.currentY += dy * dt;

        }


        if (avatar.image !== undefined && avatar.image !== null && avatar.image !== "") {

          let x = Math.floor(avatar.currentX);
          let y = Math.floor(avatar.currentY);
          let dy = avatar.currentY - Math.floor(avatar.currentY);
          if (dy > 0) y++;
          if (x >= 0 && x <= MAP_SIZE && y >= 0 && y <= MAP_SIZE) {
            avatarMap[x][y].push(avatar);
          }

        }

    }

    if (avatars[myId] !== undefined) {
        if (cameraMouse) {
            if (cameraX < (avatars[myId].currentX-w/128) - (w/64)/2.5) cameraX = (avatars[myId].currentX-w/128) - (w/64)/2.5;
            if (cameraY < (avatars[myId].currentY-h/96)  - (h/48)/3) cameraY = (avatars[myId].currentY-h/96)  - (h/48)/3;
            if (cameraX > (avatars[myId].currentX-w/128) + (w/64)/2.5) cameraX = (avatars[myId].currentX-w/128) + (w/64)/2.5;
            if (cameraY > (avatars[myId].currentY-h/96)  + (h/48)/3) cameraY = (avatars[myId].currentY-h/96)  + (h/48)/3;
        } else {
            if (cameraX < (avatars[myId].currentX-w/128) - (w/64)/4) cameraX = (avatars[myId].currentX-w/128) - (w/64)/4;
            if (cameraY < (avatars[myId].currentY-h/96)  - (h/48)/4) cameraY = (avatars[myId].currentY-h/96)  - (h/48)/4;
            if (cameraX > (avatars[myId].currentX-w/128) + (w/64)/4) cameraX = (avatars[myId].currentX-w/128) + (w/64)/4;
            if (cameraY > (avatars[myId].currentY-h/96)  + (h/48)/4) cameraY = (avatars[myId].currentY-h/96)  + (h/48)/4;
        }
    }

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_SIZE-w/64) cameraX = MAP_SIZE-w/64;
    if (cameraY > MAP_SIZE-h/48) cameraY = MAP_SIZE-h/48;

}

function calculatePath(endX, endY) {

    let nodes = [];

    if (endX < 1 || endY < 1 || endX > MAP_SIZE-1 || endY > MAP_SIZE-1) return [];
    if (tileMap[endX][endY].length > 1) return [];
    for (let id of Object.keys(avatars)) {
        if (endX === avatars[id].targetX && endY === avatars[id].targetY) return [];
    }

    let adjacencies = [{x: 0, y:-1, g:10}, {x:  1, y:-1, g:14}, {x: 1, y:0, g:10}, {x: 1, y: 1, g:14},
                       {x: 0, y: 1, g:10}, {x: -1, y: 1, g:14}, {x:-1, y:0, g:10}, {x:-1, y:-1, g:14}];

    let startX = avatars[myId].targetX;
    let startY = avatars[myId].targetY;

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

            if (tileMap[x][y].length > 1) continue;
            if (adj.x !== 0 && adj.y !== 0) {
                if (tileMap[current.x][y].length > 1) continue;
                if (tileMap[x][current.y].length > 1) continue;
            }

            for (let id of Object.keys(avatars)) {
                if (x === avatars[id].targetX && y === avatars[id].targetY) continue;
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
