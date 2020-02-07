function fixSize() {

    console.log("*** Fixing window size... ***");

    w = window.innerWidth;
    h = window.innerHeight;

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_SIZE-w/64) cameraX = MAP_SIZE-w/64;
    if (cameraY > MAP_SIZE-h/48) cameraY = MAP_SIZE-h/48;

    const canvas = document.getElementById('avatarCanvas');
    canvas.width = w;
    canvas.height = h;

}

function drawCurrentTile(context) {

  context.fillStyle = "navy";
  context.fillRect(8,8,80,80);
  context.drawImage(tiles[selectedTile], 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, 16, 16, 64, 64);

  context.fillStyle = 'blue';
  context.textAlign = 'center';
  context.font = 'bold 16px Arial';
  let modeString;
  switch (mode) {
      case DELETE_MODE:
        modeString = "DELETE";
        context.fillStyle = 'red';
        break;
      case PICK_MODE:
        modeString = "PICK";
        context.fillStyle = 'green';
        break;
      case NULL_MODE:
        modeString = "NULL";
        context.fillStyle = 'cyan';
        break;
      case EXCAVATE_MODE:
        modeString = "EXCAVATE";
        context.fillStyle = 'orange';
        break;
      case REFILL_MODE:
        modeString = "REFILL";
        context.fillStyle = 'magenta';
        break;
    default:
        modeString = "NORMAL";
    }
    context.fillText(modeString, 48, 105);

}

function drawTiles(context) {

    tileMapSize = Math.floor(Math.sqrt((w * (h - 64)) / TILE_COUNT) - 1);

    context.fillStyle = "black";
    context.globalAlpha = 0.5;
    context.fillRect(0,0,w,h);

    context.globalAlpha = 1;

    let i = 0, j = 0;
    for (let t = 0; t < TILE_COUNT; t++) {

        if (t === selectedTile) {
          context.fillStyle = "white";
        } else {
          context.fillStyle = "navy";
        }

        context.fillRect(i + 8, j + 8, tileMapSize-16, tileMapSize-16);
        context.drawImage(tiles[t], 0, 0, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE, i + 16, j + 16, tileMapSize-32, tileMapSize-32);

        i += tileMapSize;
        if (i + tileMapSize > w) {
          j += tileMapSize;
          i = 0;
        }
    }

}

function drawControls(context) {

    context.fillStyle = 'white';
    context.textAlign = 'right';

    let s = 30;

    context.font = 'bold 18px Arial';
    context.fillText("Controls (H to hide)", w-10, s); s += 30;

    context.font = '18px Arial';
    context.fillText("Arrow keys - Move", w-10, s); s += 20;
    context.fillText("Left Click - Path Move", w-10, s); s += 20;
    context.fillText("C - Chat (Escape to cancel)", w-10, s); s += 20;
    context.fillText("Enter - Place sign (Escape to cancel)", w-10, s); s += 30;

    context.fillText("Right Click - Place block (limited range)", w-10, s); s += 20;
    context.fillText("WSAD - Place blocks adjacent", w-10, s); s += 20;
    context.fillText("Space - Place floor tile", w-10, s); s += 20;
    context.fillText("1-9 - Place blocks overhead", w-10, s); s += 30;

    context.fillText("X or Delete - Delete mode", w-10, s); s += 20;
    context.fillText("Z - Null mode", w-10, s); s += 20;
    context.fillText("Q - Pick mode (Just one)", w-10, s); s += 20;
    context.fillText("E - Excavate mode", w-10, s); s += 20;
    context.fillText("R - Refill mode", w-10, s); s += 20;
    context.fillText("Escape - Normal mode", w-10, s); s += 20;
    context.fillText("Middle click or \\ (Hold) & Mouse - Mode chooser", w-10, s); s += 30;

    context.fillText("T (Hold) & Mouse or PageUp / PageDown - Select block tile", w-10, s); s += 20;
    context.fillText("Shift (Hold) - X-Ray mode", w-10, s); s += 30;

    context.fillText("M (Hold) - Show mini map", w-10, s); s += 20;
    context.fillText("K - Toggle mouse controllable camera", w-10, s); s += 30;

    context.textAlign = 'center';
    context.fillText(mouseX + ", " + mouseY, mousePosition.x, mousePosition.y);

}

function drawModeChooser(context) {


    context.font = '44px Arial';
    context.textAlign = 'center';

    let gap = h/7;

    if (mode === NORMAL_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Normal", w/2, gap);

    if (mode === DELETE_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Delete", w/2, gap*2);

    if (mode === PICK_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Pick (Once)", w/2, gap*3);

    if (mode === NULL_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Null", w/2, gap*4);

    if (mode === EXCAVATE_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Excavate", w/2, gap*5);

    if (mode === REFILL_MODE) {
        context.fillStyle = 'white';
    } else {
        context.fillStyle = 'blue';
    }
    context.fillText("Refill", w/2, gap*6);


}
