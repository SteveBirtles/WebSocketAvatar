let showControls = true;
let showTiles = false;
let mousePosition = {x: 0, y: 0}, leftMouseDown = false, rightMouseDown = false;
let pressedKeys = {};
let selectedTile = 86;
let blockPlace = false;
let mouseX, mouseY;
let pathTargetX = null, pathTargetY = null;
let chatting = false;
let pendingTileChanges = [];

function processInputs() {

    //console.log("*** Procesing inputs ***");

    mouseX = Math.floor((mousePosition.x + cameraX*64 + 32) / 64);
    mouseY = Math.floor((mousePosition.y + cameraY*48 + 24) / 48);

    if (!(chatting || showTiles)) {
        if (leftMouseDown) {
            pathTargetX = mouseX;
            pathTargetY = mouseY;
        } else if (rightMouseDown) {
            pathTargetX = null;
            pathTargetY = null;
        }
    }

    if (myId !== undefined && avatars[myId] !== undefined) {

        if (avatars[myId].currentX === avatars[myId].targetX &&
              avatars[myId].currentY === avatars[myId].targetY) {

            let moved = false;

            if (pressedKeys["Enter"] && !(chatting || showTiles)) {
                chatting = true;
                document.getElementById("chat").style.display = "block";
                document.getElementById("chattext").focus();
            }

            if (!showTiles && (pressedKeys["t"] || pressedKeys["T"])) {
                showTiles = true;
            }

            if (showTiles) {

              selectedTile = Math.floor(mousePosition.y / 96) * Math.floor(w / 96) + Math.floor(mousePosition.x / 96);

              if (selectedTile < 0) selectedTile = 0;
              if (selectedTile >= TILE_COUNT) selectedTile = TILE_COUNT - 1;

              if (!(pressedKeys["t"] || pressedKeys["T"])) {
                showTiles = false;
              }

            }

            if (!(chatting || showTiles)) {

                let x = Math.floor(avatars[myId].currentX);
                let y = Math.floor(avatars[myId].currentY);

                if (pressedKeys["h"]) {
                  if (!blockPlace) {
                    showControls = !showControls;
                  }
                  blockPlace = true;
                } else if ((pressedKeys["w"] || pressedKeys["W"]) && y > 0) {
                    if (!blockPlace) {
                        if (pressedKeys["`"]) {
                            pendingTileChanges.push({x: x, y: y-1, tile: -2});
                        } else if (pressedKeys["Delete"] || pressedKeys["Backspace"]) {
                            pendingTileChanges.push({x: x, y: y-1, tile: -1});
                        } else if (pressedKeys["Insert"]) {
                            if (tileMap[x][y-1].length > 0) {
                                selectedTile = tileMap[x][y-1][tileMap[x][y-1].length - 1];
                            }
                        } else {
                            pendingTileChanges.push({x: x, y: y-1, tile: selectedTile});
                        }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["s"] || pressedKeys["S"]) && y < MAP_SIZE) {
                    if (!blockPlace) {
                      if (pressedKeys["`"]) {
                          pendingTileChanges.push({x: x, y: y+1, tile: -2});
                      } else if (pressedKeys["Delete"] || pressedKeys["Backspace"]) {
                          pendingTileChanges.push({x: x, y: y+1, tile: -1});
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x][y+1].length > 0) {
                              selectedTile = tileMap[x][y+1][tileMap[x][y+1].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x, y: y+1, tile: selectedTile});
                      }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["a"] || pressedKeys["A"]) && x > 0) {
                    if (!blockPlace) {
                      if (pressedKeys["`"]) {
                          pendingTileChanges.push({x: x-1, y: y, tile: -2});
                      } else if (pressedKeys["Delete"] || pressedKeys["Backspace"]) {
                          pendingTileChanges.push({x: x-1, y: y, tile: -1});
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x-1][y].length > 0) {
                              selectedTile = tileMap[x-1][y][tileMap[x-1][y].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x-1, y: y, tile: selectedTile});
                      }
                    }
                    blockPlace = true;
                } else if ((pressedKeys["d"] || pressedKeys["D"]) && y < MAP_SIZE) {
                    if (!blockPlace) {
                      if (pressedKeys["`"]) {
                          pendingTileChanges.push({x: x+1, y: y, tile: -2});
                      } else if (pressedKeys["Delete"] || pressedKeys["Backspace"]) {
                          pendingTileChanges.push({x: x+1, y: y, tile: -1});
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x+1][y].length > 0) {
                              selectedTile = tileMap[x+1][y][tileMap[x+1][y].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x+1, y: y, tile: selectedTile});
                      }
                    }
                    blockPlace = true;
                } else if (pressedKeys["1"] || pressedKeys["2"] || pressedKeys["3"] || pressedKeys["4"] || pressedKeys["5"] ||
                            pressedKeys["6"] || pressedKeys["7"] || pressedKeys["8"] || pressedKeys["9"] || pressedKeys["f"] || pressedKeys["F"]) {
                    if (!blockPlace) {
                      let z;
                      if (pressedKeys["1"]) z = 3;
                      if (pressedKeys["2"]) z = 4;
                      if (pressedKeys["3"]) z = 5;
                      if (pressedKeys["4"]) z = 6;
                      if (pressedKeys["5"]) z = 7;
                      if (pressedKeys["6"]) z = 8;
                      if (pressedKeys["7"]) z = 9;
                      if (pressedKeys["8"]) z = 10;
                      if (pressedKeys["9"]) z = 11;
                      if (pressedKeys["f"] || pressedKeys["F"]) z = 0;
                      if (pressedKeys["`"]) {
                          pendingTileChanges.push({x: x, y: y, tile: -2, z});
                      } else if (pressedKeys["Delete"] || pressedKeys["Backspace"]) {
                          pendingTileChanges.push({x: x, y: y, tile: -1, z});
                      } else if (pressedKeys["Insert"]) {
                          if (tileMap[x][y].length > 0) {
                              selectedTile = tileMap[x][y][tileMap[x][y].length - 1];
                          }
                      } else {
                          pendingTileChanges.push({x: x, y: y, tile: selectedTile, z})
                      }
                    }
                    blockPlace = true;
                } else if (pressedKeys["PageUp"]) {
                    if (!blockPlace) {
                      selectedTile -= 1;
                      if (selectedTile < 0) selectedTile = tiles.length-1;
                    }
                    blockPlace = true;
                } else if (pressedKeys["PageDown"]) {
                    if (!blockPlace) {
                      selectedTile += 1;
                      if (selectedTile >= tiles.length-1) selectedTile = 0;
                    }
                    blockPlace = true;
                } else {
                  blockPlace = false;
                }

                if (pressedKeys["ArrowUp"] || pressedKeys["ArrowDown"] || pressedKeys["ArrowLeft"] || pressedKeys["ArrowRight"]) {
                    pathTargetX = null;
                    pathTargetY = null
                }


                if ((pressedKeys["ArrowUp"] || (pathTargetY !== null && pathTargetY < avatars[myId].targetY))
                      && !(pressedKeys["w"] || pressedKeys["W"]) && avatars[myId].targetY > 1) {
                    let clearPath = tileMap[avatars[myId].targetX][avatars[myId].targetY-1].length <= 1 ||
                        (tileMap[avatars[myId].targetX][avatars[myId].targetY-1].length >= 3 &&
                            tileMap[avatars[myId].targetX][avatars[myId].targetY-1][1] === null &&
                            tileMap[avatars[myId].targetX][avatars[myId].targetY-1][2] === null);
                    if (clearPath) {
                        avatars[myId].targetY -= 1;
                        moved = true;
                    }
                }
                if ((pressedKeys["ArrowDown"] || (pathTargetY !== null && pathTargetY > avatars[myId].targetY))
                        && !(pressedKeys["s"] || pressedKeys["S"]) && avatars[myId].targetY < MAP_SIZE-1) {
                    let clearPath = tileMap[avatars[myId].targetX][avatars[myId].targetY+1].length <= 1 ||
                        (tileMap[avatars[myId].targetX][avatars[myId].targetY+1].length >= 3 &&
                            tileMap[avatars[myId].targetX][avatars[myId].targetY+1][1] === null &&
                            tileMap[avatars[myId].targetX][avatars[myId].targetY+1][2] === null);
                    if (clearPath) {
                        avatars[myId].targetY += 1;
                        moved = true;
                    }
                }
                if ((pressedKeys["ArrowLeft"] || (pathTargetX !== null && pathTargetX < avatars[myId].targetX))
                        && !(pressedKeys["a"] || pressedKeys["A"]) && avatars[myId].targetX > 1) {
                    let clearPath = tileMap[avatars[myId].targetX-1][avatars[myId].targetY].length <= 1 ||
                        (tileMap[avatars[myId].targetX-1][avatars[myId].targetY].length >= 3 &&
                            tileMap[avatars[myId].targetX-1][avatars[myId].targetY][1] === null &&
                            tileMap[avatars[myId].targetX-1][avatars[myId].targetY][2] === null);
                    if (clearPath) {
                        avatars[myId].targetX -= 1;
                        moved = true;
                    }
                }
                if ((pressedKeys["ArrowRight"] || (pathTargetX !== null && pathTargetX > avatars[myId].targetX))
                        && !(pressedKeys["d"] || pressedKeys["D"]) && avatars[myId].targetX < MAP_SIZE-1) {
                    let clearPath = tileMap[avatars[myId].targetX+1][avatars[myId].targetY].length <= 1 ||
                        (tileMap[avatars[myId].targetX+1][avatars[myId].targetY].length >= 3 &&
                            tileMap[avatars[myId].targetX+1][avatars[myId].targetY][1] === null &&
                            tileMap[avatars[myId].targetX+1][avatars[myId].targetY][2] === null);
                    if (clearPath) {
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

                    blockPlace = false;

                }

                if (pendingTileChanges.length > 0) {

                    for (let change of pendingTileChanges) {

                        if (!change.hasOwnProperty("z")) {
                            if (change.tile === -1) {
                                change.z = tileMap[change.x][change.y].length - 1;
                            } else {
                                change.z = tileMap[change.x][change.y].length;
                            }
                        }

                        connection.send(JSON.stringify(change));


                    }

                    pendingTileChanges = [];

                }

            }

        }

    }

}
