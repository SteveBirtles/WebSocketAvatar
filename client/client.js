const TILE_COUNT = 176;
const AVATAR_COUNT = 43;
const MAP_SIZE = 128;
const TILE_SOURCE_SIZE = 64;
let w = 0, h = 0;
let cameraX = 0, cameraY = 0;

const moveTime = 200;
const chatLifespan = 2000;

let pressedKeys = {};

let connection;

let clientTime;
let lastUpdateTime;
let lastServerTime;
let worldTime;
let lastClientTime;

let selectedAvatar;
let selectedTile = 86;
let tiles = [];
let myId;
let avatars = {};
let chatting = false;
let shadow = new Image();

let tileMap = [];
let pendingTileChanges = [];

function pageLoad() {

    let tileDiv = document.getElementById("tilesDiv");

    let tileHTML = '';

    for (let i = 0; i < TILE_COUNT; i++) {
        tileHTML += `<img src="/client/tiles/tile${i}.png" id="tile${i}" class="tile">`;
    }

    tileDiv.innerHTML = tileHTML;

    for (let i = 0; i < TILE_COUNT; i++) {
      tiles.push(document.getElementById("tile" + i));
    }

    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([]);
      }
      tileMap.push(row);
    }

    let pickerDiv = document.getElementById("avatarPicker");

    let pickerHTML = "<h1>Welcome! Please choose your avatar:</h1>";

    for (let i = 1; i <= AVATAR_COUNT; i++) {
        pickerHTML += `<img src="/client/avatars/${i}.png" id="avatar${i}" class="avatar">`;
    }

    pickerHTML += '<div id="pickerInputDiv">';
    pickerHTML += '<input type="text" placeholder="Your name" id="avatarName"></input>';
    pickerHTML += '<button id="joinButton">Join</button>';
    pickerHTML += '</div>';

    pickerDiv.innerHTML = pickerHTML;

    let avatarImages = document.getElementsByClassName("avatar");
    for (let ai of avatarImages) {
        ai.addEventListener("click", event => {
            if (selectedAvatar !== undefined) selectedAvatar.classList.remove("selectedAvatar");
            selectedAvatar = event.target;
            selectedAvatar.classList.add("selectedAvatar");
            document.getElementById("avatarName").focus();
        });
    }

    let joinButton = document.getElementById("joinButton");

    joinButton.addEventListener("click", checkChoices);

    document.getElementById("avatarName").addEventListener("keyup", event => {
        if (event.key == "Enter") checkChoices();
    });

    shadow.src = "/client/shadow.png";

}

function checkChoices() {

    let pickerDiv = document.getElementById("avatarPicker");

    if (selectedAvatar === undefined) {
      alert("Please pick an avatar!");
      return;
    }
    if (document.getElementById("avatarName").value.trim() == "") {
      alert("Please choose a name!");
      return;
    }
    document.getElementById("content").style.display = "none";
    document.getElementById("avatarCanvas").style.display = "block";

    joinGame();

}

function fixSize() {

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

function joinGame() {

    let protocol = window.location.protocol.toLowerCase().replace('http', 'ws');
    let host = window.location.hostname;
    let port = window.location.port;

    connection = new WebSocket(protocol + '//' + host + ':' + port);

    connection.addEventListener('message', receiveMessage);
    connection.addEventListener('error', event => alert(event));

    window.addEventListener("keydown", event => pressedKeys[event.key] = true);
    window.addEventListener("keyup", event => pressedKeys[event.key] = false);

    document.getElementById("chattext").addEventListener("keyup", chat);

    fixSize();
    window.addEventListener("resize", fixSize);
    window.requestAnimationFrame(gameFrame);

}


let fps = 0;
let lastFPStime = 0;
let blockPlace = false;
function gameFrame(frameTime) {

    lastClientTime = clientTime;
    clientTime = Math.floor(frameTime);
    worldTime = lastServerTime + clientTime - lastUpdateTime;

    if (frameTime - lastFPStime > 1000) {
      document.title = "WebSocket Powererd Avatars [" + fps + " fps]";
      fps = 0;
      lastFPStime = frameTime;
    } else {
      fps++;
    }

    if (myId !== undefined && avatars[myId] !== undefined) {

        if (avatars[myId].currentX === avatars[myId].targetX &&
              avatars[myId].currentY === avatars[myId].targetY) {

            let moved = false;

            if (pressedKeys["Enter"] && !chatting) {
                chatting = true;
                document.getElementById("chat").style.display = "block";
                document.getElementById("chattext").focus();
            }

            if (!chatting) {

                let x = Math.floor(avatars[myId].currentX);
                let y = Math.floor(avatars[myId].currentY);

                if ((pressedKeys["w"] || pressedKeys["W"]) && y > 0) {
                    if (!blockPlace) {
                        if (pressedKeys["Delete"]) {
                            pendingTileChanges.push({x: x, y: y-1, tile: -1})
                        } else if (pressedKeys["Insert"]) {
                            if (tileMap[x][y-1].length > 0) {
                                selectedTile = tileMap[x][y-1][tileMap[x][y-1].length - 1];
                            }
                        } else {
                            pendingTileChanges.push({x: x, y: y-1, tile: selectedTile})
                        }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["s"] || pressedKeys["S"]) && y < MAP_SIZE) {
                    if (!blockPlace) {
                      if (pressedKeys["Delete"]) {
                          pendingTileChanges.push({x: x, y: y+1, tile: -1})
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x][y+1].length > 0) {
                              selectedTile = tileMap[x][y+1][tileMap[x][y+1].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x, y: y+1, tile: selectedTile})
                      }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["a"] || pressedKeys["A"]) && x > 0) {
                    if (!blockPlace) {
                      if (pressedKeys["Delete"]) {
                          pendingTileChanges.push({x: x-1, y: y, tile: -1})
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x-1][y].length > 0) {
                              selectedTile = tileMap[x-1][y][tileMap[x-1][y].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x-1, y: y, tile: selectedTile})
                      }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["d"] || pressedKeys["D"]) && y < MAP_SIZE) {
                    if (!blockPlace) {
                      if (pressedKeys["Delete"]) {
                          pendingTileChanges.push({x: x+1, y: y, tile: -1})
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x+1][y].length > 0) {
                              selectedTile = tileMap[x+1][y][tileMap[x+1][y].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x+1, y: y, tile: selectedTile})
                      }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["q"] || pressedKeys["Q"])) {
                    if (!blockPlace) {
                      selectedTile -= 1;
                      if (selectedTile < 0) selectedTile = tiles.length-1;
                    }
                    blockPlace = true;
                } else if ((pressedKeys["e"] || pressedKeys["E"])) {
                    if (!blockPlace) {
                      selectedTile += 1;
                      if (selectedTile >= tiles.length-1) selectedTile = 0;
                    }
                    blockPlace = true;
                } else if (pressedKeys["PageUp"]) {
                    if (!blockPlace) {
                      selectedTile -= 10;
                      if (selectedTile < 0) selectedTile = tiles.length-1;
                    }
                    blockPlace = true;
                } else if (pressedKeys["PageDown"]) {
                    if (!blockPlace) {
                      selectedTile += 10;
                      if (selectedTile >= tiles.length-1) selectedTile = 0;
                    }
                    blockPlace = true;
                } else {
                  blockPlace = false;
                }

                if (pressedKeys["ArrowUp"] && avatars[myId].targetY > 1) {
                    if (tileMap[avatars[myId].targetX][avatars[myId].targetY-1].length <= 1) {
                        avatars[myId].targetY -= 1;
                        moved = true;
                    }
                }
                if (pressedKeys["ArrowDown"] && avatars[myId].targetY < MAP_SIZE-1) {
                    if (tileMap[avatars[myId].targetX][avatars[myId].targetY+1].length <= 1) {
                        avatars[myId].targetY += 1;
                        moved = true;
                    }
                }
                if (pressedKeys["ArrowLeft"] && avatars[myId].targetX > 1) {
                    if (tileMap[avatars[myId].targetX-1][avatars[myId].targetY].length <= 1) {
                        avatars[myId].targetX -= 1;
                        moved = true;
                    }
                }
                if (pressedKeys["ArrowRight"] && avatars[myId].targetX < MAP_SIZE-1) {
                    if (tileMap[avatars[myId].targetX+1][avatars[myId].targetY].length <= 1) {
                        avatars[myId].targetX += 1;
                        moved = true;
                    }
                  }

                if (moved) {

                    avatars[myId].targetT = worldTime + moveTime;
                    avatars[myId].lastT = worldTime;

                    let data = {x: avatars[myId].targetX,
                                y: avatars[myId].targetY,
                                t: avatars[myId].targetT}

                    connection.send(JSON.stringify(data));

                }

                if (pendingTileChanges.length > 0) {

                    for (let change of pendingTileChanges) {

                        connection.send(JSON.stringify(change));

                    }

                    pendingTileChanges = [];

                }

            }

        }

    }

    let canvas = document.getElementById("avatarCanvas");
    let context = canvas.getContext("2d");

    context.clearRect(0,0,w,h);

    context.strokeStyle = 'grey';

    for (let i = 32; i < w; i += 64) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 768);
      context.stroke();
    }

    for (let i = 24; i < h; i += 48) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(1024, i);
      context.stroke();
    }

    let avatarMap = [];
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
        if (cameraX < (avatars[myId].currentX-w/128) - (w/64)/4) cameraX = (avatars[myId].currentX-w/128) - (w/64)/4;
        if (cameraY < (avatars[myId].currentY-h/96)  - (h/48)/4) cameraY = (avatars[myId].currentY-h/96)  - (h/48)/4;
        if (cameraX > (avatars[myId].currentX-w/128) + (w/64)/4) cameraX = (avatars[myId].currentX-w/128) + (w/64)/4;
        if (cameraY > (avatars[myId].currentY-h/96)  + (h/48)/4) cameraY = (avatars[myId].currentY-h/96)  + (h/48)/4;
    }

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > MAP_SIZE-w/64) cameraX = MAP_SIZE-w/64;
    if (cameraY > MAP_SIZE-h/48) cameraY = MAP_SIZE-h/48;

    for (let y =  Math.floor(cameraY); y <=  Math.floor(cameraY) + h/48 + 1; y++) {

        for (let z = 0; z < 16; z++) {

            let hideForeground = pressedKeys["Shift"] && !chatting && avatars[myId] !== undefined && y > Math.floor(avatars[myId].currentY);
            if (hideForeground && z > 0) continue;

            for (let x =  Math.floor(cameraX); x <=  Math.floor(cameraX) + w/64 + 1; x++) {

              context.globalAlpha = 1;

              if (tileMap[Math.floor(x)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)].length > 0 && tileMap[Math.floor(x)][Math.floor(y)][z] != null) {

                let t = tiles[tileMap[Math.floor(x)][Math.floor(y)][z]];

                if (z > 0) {

                  context.fillStyle = 'black';
                  context.fillRect(x*64-32 - cameraX*64, y*48+24 - z*64 - cameraY*48, 64, 64);

                  context.globalAlpha = 0.75;
                  context.drawImage(t, 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, x*64-32 - cameraX*64, y*48+24 - z*64 - cameraY*48, 64, 64);

                }

                if (hideForeground) {
                  context.globalAlpha = 0.5;
                } else {
                  context.globalAlpha = 1;
                }
                context.drawImage(t, 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, x*64-32 - cameraX*64, y*48-24 - z*64 - cameraY*48, 64, 48);

              }

              if (z === 0 && pressedKeys["Shift"] && !chatting && tileMap[Math.floor(x)] !== undefined && tileMap[Math.floor(x)][Math.floor(y)] !== undefined) {
                context.fillStyle = 'blue';
                context.font = '10px Arial';
                context.textAlign = 'center';
                context.fillText(x + ", " + y + " (" + tileMap[Math.floor(x)][Math.floor(y)].length + ")", x*64 - cameraX*64, y*48 - cameraY*48);
              }

            }

            if (z === 0 && pressedKeys["Shift"] && !chatting) {
              if (avatars[myId] !== undefined && Math.floor(avatars[myId].currentY) === y) {
                context.globalAlpha = 0.5;
                context.fillStyle = "red";
                context.fillRect(avatars[myId].currentX*64-32 - cameraX*64, avatars[myId].currentY*48-24 - cameraY*48, 64, 48);
                context.globalAlpha = 1;
              }
            }

          }

          if (pressedKeys["Shift"] & !chatting) continue;

            for (let x = Math.floor(cameraX); x <=  Math.floor(cameraX) + w/64 + 1; x++) {
              for (let z = 0; z < 16; z++) {

                if (avatarMap[Math.floor(x)] !== undefined && avatarMap[Math.floor(x)][Math.floor(y)] !== undefined) {

                  for (let avatar of avatarMap[Math.floor(x)][Math.floor(y)]) {

                    context.globalAlpha = 0.25;
                    context.drawImage(shadow, 0,0,256,256,avatar.currentX*64 - cameraX*64 - 32, avatar.currentY*48 - cameraY*48 - 24, 64, 48);
                    context.globalAlpha = 1;

                    context.drawImage(avatar.image, avatar.currentX*64-32 - cameraX*64, avatar.currentY*48-128 - cameraY*48);

                    if (avatar.chattime !== undefined && avatar.chattime > worldTime) {

                        context.fillStyle = 'blue';
                        context.font = '24px Arial';
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

    context.fillStyle = "navy";
    context.fillRect(10,10,84,84);
    context.drawImage(tiles[selectedTile], 0,0,TILE_SOURCE_SIZE,TILE_SOURCE_SIZE, 20, 20, 64, 64);

    //context.fillStyle = 'white';
    //context.font = '36px Arial';
    //context.textAlign = 'left';
    //context.fillText("Camera: " + cameraX + ", " + cameraY, 300, 100);

    window.requestAnimationFrame(gameFrame);

}

function receiveMessage(event) {

    let data = JSON.parse(event.data);

    if (data.hasOwnProperty("you")) {

        myId = data.you;
        console.log("Connected and given id of " + myId);

        let newAvatar = {x: Math.floor(Math.random() * MAP_SIZE) + 1,
                         y: Math.floor(Math.random() * MAP_SIZE) + 1,
                         t: 0,
                         image: selectedAvatar.id,
                         name: document.getElementById("avatarName").value};

        connection.send(JSON.stringify(newAvatar));

    }

    if (data.hasOwnProperty("id")) {

        if (avatars[data.id] === undefined) avatars[data.id] = {};

        if (data.hasOwnProperty("x")) avatars[data.id].targetX = data.x;
        if (data.hasOwnProperty("y")) avatars[data.id].targetY = data.y;
        if (data.hasOwnProperty("t")) avatars[data.id].targetT = data.t;

        if (data.hasOwnProperty("chat")) avatars[data.id].chat = data.chat;
        if (data.hasOwnProperty("chattime")) avatars[data.id].chattime = data.chattime;

        if (data.hasOwnProperty("image") && avatars[data.id].image === undefined)
                          avatars[data.id].image = document.getElementById(data.image);

        if (data.hasOwnProperty("name")) avatars[data.id].name = data.name;

        console.log(event.data);

    }

    if (data.hasOwnProperty("stack")) {

        let x, y
        if (data.hasOwnProperty("x")) x = data.x;
        if (data.hasOwnProperty("y")) y = data.y;

        if (x !== undefined && y !== undefined) {
            tileMap[x][y] = data.stack;
        }

    }

    if (data.hasOwnProperty("serverTime")) {

        lastServerTime = data.serverTime;
        lastUpdateTime = clientTime;

    }

    if (data.hasOwnProperty("delete")) {

        delete avatars[data.delete];

    }

}

function chat(event) {

    if (event.key == "Enter" && event.target.value != "") {
        let chatData = {chat: event.target.value, chattime: worldTime + chatLifespan}
        connection.send(JSON.stringify(chatData));

        event.target.value = "";
        document.getElementById("chat").style.display = "none";
        pressedKeys = {};
        chatting = false;

    }

}
