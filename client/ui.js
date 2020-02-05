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

        context.fillRect(i + 8, j + 8, 80, 80);
        context.drawImage(tiles[t], i + 16, j + 16);

        i += 96;
        if (i + 96 > w) {
          j += 96;
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
    context.fillText("Right Click - Cancel Path", w-10, s); s += 20;
    context.fillText("Enter - Chat", w-10, s); s += 30;

    context.fillText("WSAD - Place blocks adjacent", w-10, s); s += 20;
    context.fillText("Space - Place floor tile", w-10, s); s += 20;
    context.fillText("1-9 - Place blocks overhead", w-10, s); s += 20;

    context.fillText("X - Delete mode", w-10, s); s += 20;
    context.fillText("Z - Null mode", w-10, s); s += 20;
    context.fillText("Q - Pick mode (Just one)", w-10, s); s += 20;
    context.fillText("E - Excavate mode", w-10, s); s += 20;
    context.fillText("R - Refill mode", w-10, s); s += 20;
    context.fillText("Escape - Normal mode", w-10, s); s += 30;

    context.fillText("T (Hold) & Mouse or PageUp / PageDown - Select block tile", w-10, s); s += 20;
    context.fillText("Shift (Hold) - X-Ray mode", w-10, s); s += 20;

    context.textAlign = 'center';
    context.fillText(mouseX + ", " + mouseY, mousePosition.x, mousePosition.y);

}
