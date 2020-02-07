let w = 0, h = 0;
let cameraX = 0, cameraY = 0;

let tiles = [];
let tileMap = [];

function renderWorld(context) {

    if (avatars[myId] === undefined || avatars[myId].image === undefined) {

        context.fillStyle = 'white';
        context.font = '36px Arial';
        context.textAlign = 'center';
        context.fillText("Loading world...", w/2, h/2);

    } else if (miniMap) {

        renderMiniMap(context);

    } else {

        for (let y =  Math.floor(cameraY); y <= Math.floor(cameraY) + h/48 + 16; y++) {

            renderGroundStrip(context, y);

            renderAvatarStrip(context, y);

            renderFrontStrip(context, y);

        }

    }

}

function renderMiniMap(context) {

    let miniMapTileSize = (w > h) ? Math.floor(h / MAP_SIZE) : Math.floor(w / MAP_SIZE);
    let x0 = (w/2)-(miniMapTileSize*MAP_SIZE/2);
    let y0 = (h/2)-(miniMapTileSize*MAP_SIZE/2);

    for (let x = 0; x < MAP_SIZE; x++) {
        if (tileMap[x] === undefined) continue;
        for (let y = 0; y < MAP_SIZE; y++) {
            if (tileMap[x][y] === undefined) continue;
            let l = tileMap[x][y].length;
            let t = tileMap[x][y][l - 1];
            if (t !== undefined && t !== null && tiles[t] !== undefined) {
                context.drawImage(tiles[t], 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE,
                    x0 + x*miniMapTileSize, y0 + y*miniMapTileSize, miniMapTileSize, miniMapTileSize);
            }
        }
    }

    for (let id of Object.keys(avatars)) {
        let avatar = avatars[id];

        context.fillStyle = 'white';
        context.beginPath();
        context.arc(x0 + (avatar.currentX + 0.5)*miniMapTileSize, y0 + (avatar.currentY + 0.5)*miniMapTileSize, miniMapTileSize/2, 0, 2*Math.PI);
        context.fill();

        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(avatar.name, x0 + avatar.currentX*miniMapTileSize, y0 + (avatar.currentY - 1)*miniMapTileSize);

    }


}

function renderGroundStrip(context, y) {

    for (let z = 0; z < 16; z++) {

        let offScreen = y - z * (4/3) > Math.floor(cameraY) + h/48 + 2;

        if (offScreen) continue;

        let hideForeground = xRay && !(chatting || showTiles) && avatars[myId] !== undefined && y > Math.floor(avatars[myId].currentY);
        if (hideForeground && z > 0) continue;

        for (let x =  Math.floor(cameraX); x <=  Math.floor(cameraX) + w/64 + 2; x++) {

          context.globalAlpha = 1;

          if (tileMap[Math.floor(x)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)].length > 0) {

            if (tileMap[Math.floor(x)][Math.floor(y)][z] === null) {

                if (z === tileMap[Math.floor(x)][Math.floor(y)].length - 1) {
                    context.globalAlpha = 0.3333;
                    context.fillStyle = 'blue';
                    context.fillRect(x*64-32 - cameraX*64, y*48-24 - z*64 - cameraY*48, 64+1, 48+1);
                }

            } else {

                if (tileMap[Math.floor(x)][Math.floor(y)][z] >= 0 && tileMap[Math.floor(x)][Math.floor(y)][z] <= TILE_COUNT) {

                  let t = tiles[tileMap[Math.floor(x)][Math.floor(y)][z]];

                  if (z < tileMap[Math.floor(x)][Math.floor(y)].length - 1) {

                      context.globalAlpha = 1;

                      if (tileMap[Math.floor(x)][Math.floor(y)][z + 1] === null) {
                          context.fillStyle = 'black';
                          context.fillRect(x*64-32 - cameraX*64, y*48-24 - z*64 - cameraY*48, 64+1, 48+1);
                          context.globalAlpha = 0.333;
                          context.drawImage(t, 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, x*64-32 - cameraX*64, y*48-24 - z*64 - cameraY*48, 64, 48);
                      }

                  } else {

                      if (hideForeground) {
                          context.globalAlpha = 0.5;
                      } else {
                          context.globalAlpha = 1;
                      }
                      context.drawImage(t, 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, x*64-32 - cameraX*64, y*48-24 - z*64 - cameraY*48, 64, 48);

                  }
              }

            }

          }

          if (z === 0 && xRay && !(chatting || showTiles) && tileMap[Math.floor(x)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)] !== undefined) {
            context.fillStyle = 'blue';
            context.font = '10px Arial';
            context.textAlign = 'center';
            context.fillText(x + ", " + y + " (" + tileMap[Math.floor(x)][Math.floor(y)].length + ")", x*64 - cameraX*64, y*48 - cameraY*48);
          }

        }

        if (z === 0 && !(chatting || showTiles)) {

            if (xRay) {

              if (avatars[myId] !== undefined && Math.floor(avatars[myId].currentY) === y) {
                context.globalAlpha = 0.5;
                context.fillStyle = "red";
                context.fillRect(avatars[myId].currentX*64-32 - cameraX*64, avatars[myId].currentY*48-24 - cameraY*48, 64, 48);
              }

          } else if (mouseY === y && showControls && !modeChooser) {

            context.globalAlpha = 0.25;
            context.fillStyle = "white";
            context.fillRect(mouseX*64-32 - cameraX*64, mouseY*48-24 - cameraY*48, 64, 48);

          }

        }

      }

  }

function renderAvatarStrip(context, y) {

    if (!(xRay && (chatting || showTiles)) && y < Math.floor(cameraY) + h/48 + 1) {

          for (let x = Math.floor(cameraX); x <=  Math.floor(cameraX) + w/64 + 2; x++) {
            for (let z = 0; z < 16; z++) {

              if (avatarMap[Math.floor(x)] !== undefined && avatarMap[Math.floor(x)][Math.floor(y)] !== undefined) {

                for (let avatar of avatarMap[Math.floor(x)][Math.floor(y)]) {

                 if (avatar.currentY*48-128 - cameraY*48 > h) continue;

                  context.globalAlpha = 0.25;
                  context.drawImage(shadow, 0,0,256,256,avatar.currentX*64 - cameraX*64 - 32, avatar.currentY*48 - cameraY*48 - 24, 64, 48);
                  context.globalAlpha = 1;

                  context.drawImage(avatar.image, avatar.currentX*64-32 - cameraX*64, avatar.currentY*48-128 - cameraY*48);

                  if (avatar.chattime !== undefined && avatar.chattime > worldTime) {

                      context.fillStyle = 'white';
                      context.font = 'bold 24px Arial';
                      context.textAlign = 'center';
                      context.fillText(avatar.name + ": " + avatar.chat,
                            avatar.currentX*64 - cameraX*64, avatar.currentY*48-128 - cameraY*48);

                  } else if (avatar.name !== undefined ) {

                      context.fillStyle = 'grey';
                      context.font = '24px Arial';
                      context.textAlign = 'center';
                      context.fillText(avatar.name,
                            avatar.currentX*64 - cameraX*64, avatar.currentY*48-128 - cameraY*48);

                  }

              }
            }
          }
      }
  }

}

function renderFrontStrip(context, y) {

    for (let x =  Math.floor(cameraX); x <=  Math.floor(cameraX) + w/64 + 2; x++) {

        for (let z = 1; z < 16; z++) {

            let offScreen = y - z * (4/3) > Math.floor(cameraY) + h/48 + 2;

            if (offScreen) continue;

            let hideForeground = xRay && !(chatting || showTiles) && avatars[myId] !== undefined && y > Math.floor(avatars[myId].currentY);
            if (hideForeground && z > 0) continue;

            if (tileMap[Math.floor(x)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)] !== undefined &&
                tileMap[Math.floor(x)][Math.floor(y)].length > 0) {

                if (tileMap[Math.floor(x)][Math.floor(y)][z] === null) {

                    if (z === tileMap[Math.floor(x)][Math.floor(y)].length - 1) {

                        context.globalAlpha = 0.5;
                        context.fillStyle = 'blue';
                        context.fillRect(x*64-32 - cameraX*64, y*48+24 - z*64 - cameraY*48, 64, 64);

                    }

                } else {

                    if (tileMap[Math.floor(x)][Math.floor(y)][z] >= 0 && tileMap[Math.floor(x)][Math.floor(y)][z] <= TILE_COUNT) {

                        let t = tiles[tileMap[Math.floor(x)][Math.floor(y)][z]];

                        context.globalAlpha = 1;

                        context.fillStyle = 'black';
                        context.fillRect(x*64-32 - cameraX*64, y*48+24 - z*64 - cameraY*48, 64, 64);

                        context.globalAlpha = 0.75;
                        context.drawImage(t, 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, x*64-32 - cameraX*64, y*48+24 - z*64 - cameraY*48, 64, 64);

                    }
                }

            }

        }

    }

}
