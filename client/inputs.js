let showControls = true;
let showTiles = false, tileMapSize;
let mousePosition = {x: 0, y: 0}, leftMouseDown = false, rightMouseDown = false, middleMouseDown = false;
let pressedKeys = {};
let selectedTile = 86;
let blockPlace = false;
let mouseX, mouseY;
let myPath = [];
let chatting = false, modeChooser = false, scripting = false;
let xRay = false, miniMap = false, cameraMouse = false;
let pendingTileChanges = [];
let entityToDelete = null;
const moveTime = 200;

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

    if (!(chatting || scripting || showTiles || miniMap || modeChooser)) {

        if (cameraMouse) {
            if (mousePosition.x < 64) { cameraX -= 0.33333; }
            if (mousePosition.x > w-64) { cameraX += 0.3333; }
            if (mousePosition.y < 64) { cameraY -= 0.3333; }
            if (mousePosition.y > h-64) { cameraY += 0.3333; }
        }

        if (leftMouseDown) {

            myPath = calculatePath(mouseX, mouseY);

        } else if (rightMouseDown && mouseX >= 0 && mouseY >= 0 && mouseX < MAP_SIZE && mouseY < MAP_SIZE) {

            let dx = Math.abs(mouseX - entities[myId].currentX);
            let dy = Math.abs(mouseY - entities[myId].currentY);

            if ((dx === 0 && dy === 0 && tileMap[mouseX][mouseY].length === 0) || (dx <= 2 && dy <= 2 && mouseX >= 0 && mouseY >= 0 && mouseX < MAP_SIZE && mouseY < MAP_SIZE)) {
                interact = {x: mouseX, y: mouseY};
            }

        }

    }

    if (myId !== undefined && entities[myId] !== undefined) {

        if (entities[myId].currentX === entities[myId].targetX &&
              entities[myId].currentY === entities[myId].targetY) {

            let moved = false;

            if ((pressedKeys["c"] || pressedKeys["C"]) && !(chatting || scripting || showTiles || miniMap)) {
                chatting = true;
                document.getElementById("chat").style.display = "block";
                document.getElementById("chattext").focus();
            }

            if ((pressedKeys["Enter"]) && !(chatting || scripting || showTiles || miniMap)) {
                scripting = true;
                document.getElementById("newentity").style.display = "block";
                document.getElementById("spawn").focus();

                if (recentScripts.length > 0) {
                    let optionsHTML = '';
                    for (let i = recentScripts.length-1; i >=0 ; i--) {
                        optionsHTML += (`<option value=${i}>${recentScripts[i].spawn.substring(0, 30) + "... / " + recentScripts[i].script.substring(0, 30) + "..."}</option>`);
                    }
                    let options = document.getElementById("recentScripts");
                    options.style.display = "block";
                    options.innerHTML = optionsHTML;
                    options.addEventListener("change", function(event) {
                        document.getElementById("spawn").value = recentScripts[event.target.value].spawn;
                        document.getElementById("script").value = recentScripts[event.target.value].script;
                    });
                } else {
                    document.getElementById("recentScripts").style.display = "none";
                }

                let lastSpawn = localStorage.getItem("lastSpawn")
                if (lastSpawn !== undefined && lastSpawn !== null) {
                    document.getElementById("spawn").value = lastSpawn;
                }

                let lastScript = localStorage.getItem("lastScript")
                if (lastScript !== undefined && lastScript !== null) {
                    document.getElementById("script").value = lastScript;
                }

            }

            if (!(showTiles || chatting || scripting || miniMap) && (pressedKeys["t"] || pressedKeys["T"])) {
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

          if (entityToDelete !== null && pressedKeys["Escape"]) {
              entityToDelete = null;
          }

          if (chatting && pressedKeys["Escape"]) {
              document.getElementById("chat").style.display = "none";
              chatting = false;
          }

          if (scripting && pressedKeys["Escape"]) {
              document.getElementById("newentity").style.display = "none";
              scripting = false;
          }

          if (!(chatting || scripting || showTiles)) {

                xRay = pressedKeys["Shift"];
                miniMap = pressedKeys["m"];
                modeChooser = pressedKeys["\\"] || middleMouseDown;

                if (!miniMap) {

                    let x = Math.floor(entities[myId].currentX);
                    let y = Math.floor(entities[myId].currentY);

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
                                if (tileMap[x][y-1].length > 1) {
                                  pendingTileChanges.push({x: x, y: y-1, tile: -1});
                                }
                            } else if (mode === PICK_MODE) {
                                if (tileMap[x][y-1].length > 0) {
                                    if (tileMap[x][y-1][tileMap[x][y-1].length - 1] !== null) {
                                      selectedTile = tileMap[x][y-1][tileMap[x][y-1].length - 1];
                                      mode = NORMAL_MODE;
                                    }
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
                              if (tileMap[x][y+1].length > 1) {
                                pendingTileChanges.push({x: x, y: y+1, tile: -1});
                              }
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x][y+1].length > 0) {
                                  if (tileMap[x][y+1][tileMap[x][y+1].length - 1] !== null) {
                                    selectedTile = tileMap[x][y+1][tileMap[x][y+1].length - 1];
                                    mode = NORMAL_MODE;
                                  }
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
                              if (tileMap[x-1][y].length > 1) {
                                pendingTileChanges.push({x: x-1, y: y, tile: -1});
                              }
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x-1][y].length > 0) {
                                  if (tileMap[x-1][y][tileMap[x-1][y].length - 1] !== null) {
                                    selectedTile = tileMap[x-1][y][tileMap[x-1][y].length - 1];
                                    mode = NORMAL_MODE;
                                  }
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
                              if (tileMap[x+1][y].length > 1) {
                                  pendingTileChanges.push({x: x+1, y: y, tile: -1});
                              }
                          } else if (mode === PICK_MODE) {
                              if (tileMap[x+1][y].length > 0) {
                                  if (tileMap[x+1][y][tileMap[x+1][y].length - 1] !== null) {
                                    selectedTile = tileMap[x+1][y][tileMap[x+1][y].length - 1];
                                    mode = NORMAL_MODE;
                                  }
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
                          } else if (mode === DELETE_MODE && !pressedKeys[" "]) {
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
                                if (tileMap[x][y].length > 1) {
                                  pendingTileChanges.push({x: x, y: y, tile: -1});
                                }
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
                    } else if (pressedKeys["Backspace"]) {
                        if (!blockPlace) {

                            let bestD = Infinity;
                            let bestE = null;

                            for (let id of Object.keys(entities)) {
                                if (id === String(myId)) continue;
                                let d = Math.sqrt(Math.pow(entities[myId].targetX - entities[id].targetX, 2) + Math.pow(entities[myId].targetY - entities[id].targetY, 2));
                                if (d < bestD && d <= 12) {
                                    bestE = id;
                                    bestD = d;
                                }
                            }

                            if (bestE !== null) {
                                 entityToDelete = entities[bestE];
                            } else {
                                 entityToDelete = null;
                            }

                        }
                        blockPlace = true;
                    } else if ((pressedKeys["y"] || pressedKeys["Y"]) && entityToDelete !== null) {
                        if (!blockPlace) {
                            for (let id of Object.keys(entities)) {
                                if (entityToDelete === entities[id]) {
                                    let data = {delete: id};
                                    connection.send(JSON.stringify(data));
                                    break;
                                }
                            }
                            entityToDelete = null;
                        }
                        blockPlace = true;
                    } else {
                      blockPlace = false;
                    }

                    if (pressedKeys["ArrowUp"] || pressedKeys["ArrowDown"] || pressedKeys["ArrowLeft"] || pressedKeys["ArrowRight"]) {
                        myPath = [];
                    } else if (myPath.length > 0) {
                        let next = myPath.shift();
                        entities[myId].targetX = next.x;
                        entities[myId].targetY = next.y;
                        moved = true;
                    }

                    if (pressedKeys["ArrowUp"] && !(pressedKeys["w"] || pressedKeys["W"]) && entities[myId].targetY > 1) {
                        let clearPath = tileMap[entities[myId].targetX][entities[myId].targetY-1].length <= 1 ||
                            (tileMap[entities[myId].targetX][entities[myId].targetY-1].length >= 3 &&
                                tileMap[entities[myId].targetX][entities[myId].targetY-1][1] === null &&
                                tileMap[entities[myId].targetX][entities[myId].targetY-1][2] === null);
                        if (clearPath) {
                            entities[myId].targetY -= 1;
                            moved = true;
                        }
                    }
                    if (pressedKeys["ArrowDown"] && !(pressedKeys["s"] || pressedKeys["S"]) && entities[myId].targetY < MAP_SIZE-1) {
                        let clearPath = tileMap[entities[myId].targetX][entities[myId].targetY+1].length <= 1 ||
                            (tileMap[entities[myId].targetX][entities[myId].targetY+1].length >= 3 &&
                                tileMap[entities[myId].targetX][entities[myId].targetY+1][1] === null &&
                                tileMap[entities[myId].targetX][entities[myId].targetY+1][2] === null);
                        if (clearPath) {
                            entities[myId].targetY += 1;
                            moved = true;
                        }
                    }
                    if (pressedKeys["ArrowLeft"] && !(pressedKeys["a"] || pressedKeys["A"]) && entities[myId].targetX > 1) {
                        let clearPath = tileMap[entities[myId].targetX-1][entities[myId].targetY].length <= 1 ||
                            (tileMap[entities[myId].targetX-1][entities[myId].targetY].length >= 3 &&
                                tileMap[entities[myId].targetX-1][entities[myId].targetY][1] === null &&
                                tileMap[entities[myId].targetX-1][entities[myId].targetY][2] === null);
                        if (clearPath) {
                            entities[myId].targetX -= 1;
                            moved = true;
                        }
                    }
                    if (pressedKeys["ArrowRight"] && !(pressedKeys["d"] || pressedKeys["D"]) && entities[myId].targetX < MAP_SIZE-1) {
                        let clearPath = tileMap[entities[myId].targetX+1][entities[myId].targetY].length <= 1 ||
                            (tileMap[entities[myId].targetX+1][entities[myId].targetY].length >= 3 &&
                                tileMap[entities[myId].targetX+1][entities[myId].targetY][1] === null &&
                                tileMap[entities[myId].targetX+1][entities[myId].targetY][2] === null);
                        if (clearPath) {
                            entities[myId].targetX += 1;
                            moved = true;
                        }
                   }

                    if (moved) {

                        entities[myId].targetT = worldTime + moveTime;

                        let data = {x: entities[myId].targetX,
                                    y: entities[myId].targetY,
                                    t: entities[myId].targetT}

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
