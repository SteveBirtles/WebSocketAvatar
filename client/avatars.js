const moveTime = 200;
const chatLifespan = 5000;

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
