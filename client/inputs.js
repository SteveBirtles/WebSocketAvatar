let showControls = true;
let showTiles = false, tileMapSize;
let mousePosition = {x: 0, y: 0}, leftMouseDown = false, rightMouseDown = false, middleMouseDown = false;
let pressedKeys = {};
let selectedTile = 86;
let blockPlace = false;
let mouseX, mouseY;
let pathTargetX = null, pathTargetY = null;
let chatting = false, modeChooser = false;
let xRay = false, miniMap = false, cameraMouse = false;
let pendingTileChanges = [];

const NORMAL_MODE = 0;
const DELETE_MODE = 1;
const PICK_MODE = 2;
const NULL_MODE = 3;
const EXCAVATE_MODE = 4;
const REFILL_MODE = 5;
let mode = NORMAL_MODE;

function processInputs() {

    //console.log("*** Procesing inputs ***");

    let interact = null;

    mouseX = Math.floor((mousePosition.x + cameraX*64 + 32) / 64);
    mouseY = Math.floor((mousePosition.y + cameraY*48 + 24) / 48);

    if (!(chatting || showTiles || miniMap || modeChooser)) {

        if (cameraMouse) {
            if (mousePosition.x < 64) { cameraX -= 0.33333; }
            if (mousePosition.x > w-64) { cameraX += 0.3333; }
            if (mousePosition.y < 64) { cameraY -= 0.3333; }
            if (mousePosition.y > h-64) { cameraY += 0.3333; }
        }

        if (leftMouseDown) {
            pathTargetX = mouseX;
            pathTargetY = mouseY;
        } else if (rightMouseDown && mouseX >= 0 && mouseY >= 0 && mouseX < MAP_SIZE && mouseY < MAP_SIZE) {
            let d = Math.pow(mouseX - avatars[myId].currentX, 2) + Math.pow(mouseY - avatars[myId].currentY, 2)
            if ((d === 0 && tileMap[mouseX][mouseY].length === 0) || (d > 0 && d <= 5 && mouseX >= 0 && mouseY >= 0 && mouseX < MAP_SIZE && mouseY < MAP_SIZE)) {
                interact = {x: mouseX, y: mouseY};
            }
        }

    }

    if (myId !== undefined && avatars[myId] !== undefined) {

        if (avatars[myId].currentX === avatars[myId].targetX &&
              avatars[myId].currentY === avatars[myId].targetY) {

            let moved = false;

            if ((pressedKeys["c"] || pressedKeys["C"]) && !(chatting || showTiles || miniMap)) {
                chatting = true;
                document.getElementById("chat").style.display = "block";
                document.getElementById("chattext").focus();
            }

            if (!(showTiles || chatting || miniMap) && (pressedKeys["t"] || pressedKeys["T"])) {
                showTiles = true;
            }

            if (showTiles) {

              selectedTile = Math.floor(mousePosition.y / tileMapSize) * Math.floor(w / tileMapSize) + Math.floor(mousePosition.x / tileMapSize);

              if (selectedTile < 0) selectedTile = 0;
              if (selectedTile >= TILE_COUNT) selectedTile = TILE_COUNT - 1;

              if (!(pressedKeys["t"] || pressedKeys["T"])) {
                showTiles = false;
              }

          } else if (modeChooser) {

              let gap = h/7;

              mode = Math.floor(mousePosition.y/gap - 0.5);

              if (mode < 0) mode = 0;
              if (mode > 5) mode = 5;

          }

            if (chatting && pressedKeys["Escape"]) {
                document.getElementById("chat").style.display = "none";
                chatting = false;
            }

            if (!(chatting || showTiles)) {

                xRay = pressedKeys["Shift"];
                miniMap = pressedKeys["m"];
                modeChooser = pressedKeys["\\"] || middleMouseDown;

                if (!miniMap) {

                    let x = Math.floor(avatars[myId].currentX);
                    let y = Math.floor(avatars[myId].currentY);

                    if (pressedKeys["h"] || pressedKeys["H"]) {
                      if (!blockPlace) {
                        showControls = !showControls;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["k"] || pressedKeys["K"]) {
                      if (!blockPlace) {
                        cameraMouse = !cameraMouse;
                      }
                      blockPlace = true;
                    } else if (pressedKeys["Escape"]) {
                      if (!blockPlace) {
                        mode = NORMAL_MODE;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["x"] || pressedKeys["X"] || pressedKeys["Delete"]) {
                      if (!blockPlace) {
                        mode = DELETE_MODE;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["z"] || pressedKeys["Z"]) {
                      if (!blockPlace) {
                        mode = NULL_MODE;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["q"] || pressedKeys["Q"]) {
                      if (!blockPlace) {
                        mode = PICK_MODE;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["e"] || pressedKeys["E"]) {
                      if (!blockPlace) {
                        mode = EXCAVATE_MODE;
                      }
                      blockPlace = true;
                  } else if (pressedKeys["r"] || pressedKeys["R"]) {
                      if (!blockPlace) {
                        mode = REFILL_MODE;
                      }
                      blockPlace = true;
                  } else if ((pressedKeys["w"] || pressedKeys["W"]) && y > 0) {
                        if (!blockPlace) {
                            if (mode === NULL_MODE) {
                                pendingTileChanges.push({x: x, y: y-1, tile: -2});
                            } else if (mode === DELETE_MODE) {
                                pendingTileChanges.push({x: x, y: y-1, tile: -1});
                            } else if (mode === PICK_MODE) {
                                if (tileMap[x][y-1].length > 0) {
                                    selectedTile = tileMap[x][y-1][tileMap[x][y-1].length - 1];
                                    mode = NORMAL_MODE;
                                }
                            } else if (mode === EXCAVATE_MODE) {
                                if (tileMap[x][y-1].length > 2) {
                                    pendingTileChanges.push({x: x, y: y-1, tile: -2, z: 1});
                                    pendingTileChanges.push({x: x, y: y-1, tile: -2, z: 2});
                                }
                            } else if (mode === REFILL_MODE) {
                                if (tileMap[x][y-1].length >= 2) {
                                    pendingTileChanges.push({x: x, y: y-1, tile: selectedTile, z: 1});
                                    pendingTileChanges.push({x: x, y: y-1, tile: selectedTile, z: 2});
                                }
                            } else if (mode === NORMAL_MODE) {
                                pendingTileChanges.push({x: x, y: y-1, tile: selectedTile});
                            }
                        }
                        blockPlace = true;
                    } else if ((pressedKeys["s"] || pressedKeys["S"]) && y < MAP_SIZE) {
                        if (!blockPlace) {
                          if (mode === NULL_MODE) {
                              pendingTileChanges.push({x: x, y: y+1, tile: -2});
                          } else if (mode === DELETE_MODE) {
                              pendingTileChanges.push({x: x, y: y+1, tile: -1});
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x][y+1].length > 0) {
                                  selectedTile = tileMap[x][y+1][tileMap[x][y+1].length - 1];
                                  mode = NORMAL_MODE;
                              }
                          } else if (mode === EXCAVATE_MODE) {
                              if (tileMap[x][y+1].length > 2) {
                                  pendingTileChanges.push({x: x, y: y+1, tile: -2, z: 1});
                                  pendingTileChanges.push({x: x, y: y+1, tile: -2, z: 2});
                              }
                          } else if (mode === REFILL_MODE) {
                              if (tileMap[x][y+1].length >= 2) {
                                  pendingTileChanges.push({x: x, y: y+1, tile: selectedTile, z: 1});
                                  pendingTileChanges.push({x: x, y: y+1, tile: selectedTile, z: 2});
                              }
                          } else if (mode === NORMAL_MODE) {
                              pendingTileChanges.push({x: x, y: y+1, tile: selectedTile});
                          }
                        }
                        blockPlace = true;
                    } else if ((pressedKeys["a"] || pressedKeys["A"]) && x > 0) {
                        if (!blockPlace) {
                          if (mode === NULL_MODE) {
                              pendingTileChanges.push({x: x-1, y: y, tile: -2});
                          } else if (mode === DELETE_MODE) {
                              pendingTileChanges.push({x: x-1, y: y, tile: -1});
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x-1][y].length > 0) {
                                  selectedTile = tileMap[x-1][y][tileMap[x-1][y].length - 1];
                                  mode = NORMAL_MODE;
                              }
                          } else if (mode === EXCAVATE_MODE) {
                              if (tileMap[x-1][y].length > 2) {
                                  pendingTileChanges.push({x: x-1, y: y, tile: -2, z: 1});
                                  pendingTileChanges.push({x: x-1, y: y, tile: -2, z: 2});
                              }
                          } else if (mode === REFILL_MODE) {
                              if (tileMap[x-1][y].length >= 2) {
                                  pendingTileChanges.push({x: x-1, y: y, tile: selectedTile, z: 1});
                                  pendingTileChanges.push({x: x-1, y: y, tile: selectedTile, z: 2});
                              }
                          } else if (mode === NORMAL_MODE) {
                              pendingTileChanges.push({x: x-1, y: y, tile: selectedTile});
                          }
                        }
                        blockPlace = true;
                    } else if ((pressedKeys["d"] || pressedKeys["D"]) && y < MAP_SIZE) {
                        if (!blockPlace) {
                          if (mode === NULL_MODE) {
                              pendingTileChanges.push({x: x+1, y: y, tile: -2});
                          } else if (mode === DELETE_MODE) {
                              pendingTileChanges.push({x: x+1, y: y, tile: -1});
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x+1][y].length > 0) {
                                  selectedTile = tileMap[x+1][y][tileMap[x+1][y].length - 1];
                                  mode = NORMAL_MODE;
                              }
                          } else if (mode === EXCAVATE_MODE) {
                              if (tileMap[x+1][y].length > 2) {
                                  pendingTileChanges.push({x: x+1, y: y, tile: -2, z: 1});
                                  pendingTileChanges.push({x: x+1, y: y, tile: -2, z: 2});
                              }
                          } else if (mode === REFILL_MODE) {
                              if (tileMap[x+1][y].length >= 2) {
                                  pendingTileChanges.push({x: x+1, y: y, tile: selectedTile, z: 1});
                                  pendingTileChanges.push({x: x+1, y: y, tile: selectedTile, z: 2});
                              }
                          } else if (mode === NORMAL_MODE) {
                              pendingTileChanges.push({x: x+1, y: y, tile: selectedTile});
                          }
                        }
                        blockPlace = true;
                    } else if (pressedKeys["1"] || pressedKeys["2"] || pressedKeys["3"] || pressedKeys["4"] || pressedKeys["5"] ||
                                pressedKeys["6"] || pressedKeys["7"] || pressedKeys["8"] || pressedKeys["9"] || pressedKeys[" "]) {
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
                          if (pressedKeys[" "]) z = 0;
                          if (mode === NULL_MODE) {
                              pendingTileChanges.push({x: x, y: y, tile: -2, z});
                          } else if (mode === DELETE_MODE) {
                              pendingTileChanges.push({x: x, y: y, tile: -1, z});
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x][y].length > 0) {
                                  if (tileMap[x][y][tileMap[x][y].length - 1] !== null) {
                                      selectedTile = tileMap[x][y][tileMap[x][y].length - 1];
                                  }
                                  mode = NORMAL_MODE;
                              }
                          } else if (mode === NORMAL_MODE) {
                              pendingTileChanges.push({x: x, y: y, tile: selectedTile, z})
                          }
                      }
                        blockPlace = true;
                    } else if (interact !== null) {
                        if (!blockPlace) {
                            let x = interact.x;
                            let y = interact.y;

                            if (mode === NULL_MODE) {
                                pendingTileChanges.push({x: x, y: y, tile: -2});
                            } else if (mode === DELETE_MODE) {
                                pendingTileChanges.push({x: x, y: y, tile: -1});
                            } else if (mode === PICK_MODE) {
                                if (tileMap[x][y].length > 0) {
                                    if (tileMap[x][y][tileMap[x][y].length - 1] !== null) {
                                        selectedTile = tileMap[x][y][tileMap[x][y].length - 1];
                                    }
                                    mode = NORMAL_MODE;
                                }
                            } else if (mode === NORMAL_MODE) {
                                pendingTileChanges.push({x: x, y: y, tile: selectedTile})
                            }
                        interact = null;
                        blockPlace = true;
                      }
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
}
