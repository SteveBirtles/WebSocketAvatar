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

    let s = 30;

    if (scripting) {

      context.fillStyle = 'white';
      context.textAlign = 'left';

      context.font = 'bold 20px Arial';
      context.fillText("Script commands (plus all ordinary JavaScript)", 875, s); s += 80;

      context.fillStyle = 'cyan';
      context.font = '20px monospace';
      context.fillText("getPosition()		          // returns {x, y}", 875, s); s += 30;
      context.fillText("move(dx, dy)		           // dx and dy are -1, 0 or +1", 875, s); s += 40;

      context.fillText("moved()			               // Returns true if last move has completed", 875, s); s += 40;

      context.fillText("getSpeed()", 875, s); s += 30;
      context.fillText("setSpeed(speed)          // 0.1 up to 10", 875, s); s += 30;
      context.fillText("setSolid(solidity)		     // true or false", 875, s); s += 40;

      context.fillText("getPath(x, y)            // Returns a list of {x, y}", 875, s); s += 30;
      context.fillText("worldTime()", 875, s); s += 30;
      context.fillText("listNearby(radius)	      // Returns a list of entities (max radius 12):", 875, s); s += 30;
      context.fillText("                         // {x, y, name, chat, group, image, solid, speed}, ", 875, s); s += 40;

      context.fillText("getImage()	              // image's CSS id", 875, s); s += 30;
      context.fillText("setImage(image)", 875, s); s += 40;

      context.fillText("getStack(dx, dy)			      // dx and dy are -2, -1, 0, +1, +2", 875, s); s += 30;
      context.fillText("setStack(dx, dy, stack)  // Stack must be a list of numbers and/or nulls", 875, s); s += 40;

      context.fillText("getFlag(flag)            // Flags are private variables for each entity", 875, s); s += 30;
      context.fillText("setFlag(flag, value)", 875, s); s += 40;

      context.fillText("getGroup()               // Groups give access to shared flags", 875, s); s += 30;
      context.fillText("setGroup(group)          // New groups are automtically created", 875, s); s += 30;
      context.fillText("getGroupFlag(flag)       // A flag that hasn't been set will equal undefined", 875, s); s += 30;
      context.fillText("setGroupFlag(flag, value)", 875, s); s += 40;

      context.fillText("say(text)", 875, s); s += 40;

      context.fillText("spawn(dx, dy, spawnScript, frameScript)      // Use backticks for long strings", 875, s); s += 30;
      context.fillText("selfDestruct()", 875, s); s += 40;

    } else {

      context.fillStyle = 'white';
      context.textAlign = 'right';

      context.font = 'bold 18px Arial';
      context.fillText("Controls (H to hide)", w-10, s); s += 30;

      context.font = '18px Arial';
      context.fillText("Arrow keys - Move", w-10, s); s += 20;
      context.fillText("Left Click - Path Move", w-10, s); s += 20;
      context.fillText("C - Chat (Escape to cancel)", w-10, s); s += 30;

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

      context.fillText("Enter - New entity (Escape to cancel)", w-10, s); s += 20;
      context.fillText("Backspace - Select nearest entity (max distance 12)", w-10, s); s += 20;
      context.fillText("Y - Delete selected entity (if allowed)", w-10, s); s += 30;

      context.fillText("T (Hold) & Mouse or PageUp / PageDown - Select block tile", w-10, s); s += 20;
      context.fillText("Shift (Hold) - X-Ray mode", w-10, s); s += 30;

      context.fillText("M (Hold) - Show mini map", w-10, s); s += 20;
      context.fillText("K - Toggle mouse controllable camera", w-10, s); s += 30;

      context.textAlign = 'center';
      context.fillText(mouseX + ", " + mouseY, mousePosition.x, mousePosition.y);

  }

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
