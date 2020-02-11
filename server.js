const MAP_SIZE = 128;
const MAP_FILE = "map.json";
const BASE_TILE = 0;
const CHAT_LIFE = 5000;
const MAX_PATH_LENGTH = 1000;
const DEBUG = false;

const express = require('express');
const http = require('http');
const ws = require('ws');
const fs = require('fs');
const {NodeVM, VMScript} = require('vm2');

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server({server});

let serverStartTime;
let entityCount = 0;

let entities = {};
let tileMap = [];
let groupFlags = {};

if (fs.existsSync(MAP_FILE)) {

    console.log("Loading " + MAP_FILE + "...");

    fs.readFile('map.json', 'utf8', function(err, raw) {
        if (err) throw err;
        let rawData = JSON.parse(raw);
        if (Array.isArray(rawData)) tileMap = rawData; //Compatibility
        if (rawData.hasOwnProperty("tileMap")) tileMap = rawData.tileMap;
        if (rawData.hasOwnProperty("entities")) {
            rawEntities = rawData.entities;

            let id = 0;

            for (let entity of rawEntities) {

                id++;
                entity.t = 0;
                entity.chat = "";
                entity.chattime = 0;
                //console.log(entity);

                try {
                    if (entity.script !== null && entity.script !== "") {
                        entity.vm = newVM(id);
                        entity.compiledScript = new VMScript(entity.script);
                        entity.ready = true;
                    }
                    entities[id] = entity;
                 } catch (vmError) {
                     console.log(vmError.message);
                 }

            }

            entityCount = id;

        }
        if (rawData.hasOwnProperty("groupFlags")) groupFlags = rawData.groupFlags;

    });

} else {

    console.log("Creating blank map...");

    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([BASE_TILE]);
      }
      tileMap.push(row);
    }
    fs.writeFile('map.json', JSON.stringify({entities: [], groupFlags, tileMap}), function(err) {
        if (err) throw err;
    });

}

const port = 8081;

app.use('/client', express.static('client'));

server.listen(port, function(){

  console.log(`Server started on port ${port}`);

  serverStartTime = Date.now();

  setInterval(() => {

    if (wsServer.clients.length === 0) return;

    let timeData = {serverTime : Date.now() - serverStartTime};
    let broadcast = JSON.stringify(timeData);
    for (let c of wsServer.clients) {
        c.send(broadcast);
    }

  }, 1000);

  setInterval(() => {

      for (let id of Object.keys(entities)) {
          let entity = entities[id];

          if (entity.compiledScript !== undefined && entity.compiledScript !== null) {
              try {
                   entity.vm.run(entity.compiledScript);
               } catch (vmError) {
                   let entityUpdate = {id, error: vmError.message};
                   sendUpdate(entityUpdate, wsServer.clients);
                   entity.script = null;
               }
           }

      }

  }, 100);

  setInterval(() => {

      console.log("*** SAVING MAP (" + (Date.now() - serverStartTime) + ") ***");

      let sanitisedEntities = [];

      entityLoop:
      for (let id of Object.keys(entities)) {

          for (let c of wsServer.clients) {
              if (String(c.id) === id) continue entityLoop;
          }

          let entity = entities[id];
          sanitisedEntities.push({
              x: entity.x,
              y: entity.y,
              image: entity.image,
              name: entity.name,
              script: entity.script,
              spawn: entity.spawn,
              moveTime: entity.moveTime,
              flags: entity.flags,
              solid: entity.solid,
              group: entity.group
          });

      }

      fs.writeFile('map.json', JSON.stringify({entities: sanitisedEntities, groupFlags, tileMap}), function(err) {
          if (err) throw err;
      });

  }, 30000);

});

wsServer.on('connection', client => {

    entityCount++;
    client.id = entityCount;

    console.log(`Client ${client.id} connected!`);

    for (let id of Object.keys(entities)) {
        let entity = {id,
            x: entities[id].x,
            y: entities[id].y,
            t: 0,
            name: entities[id].name,
            image: entities[id].image,
            solid: true
        };
        sendUpdate(entity, [client]);
    }

    for (let x = 0; x <= MAP_SIZE; x++) {
      for (let y = 0; y <= MAP_SIZE; y++) {
          sendTileStack(x, y, tileMap[x][y], [client]);
      }
    }

    client.send(JSON.stringify({you: client.id, serverTime: Date.now() - serverStartTime, x: 64, y: 64}));

    for (let tries = 0; tries < 100; tries++) {
        let x = Math.floor(MAP_SIZE/2 + Math.random() * 8 - 4);
        let y = Math.floor(MAP_SIZE/2 + Math.random() * 8 - 4);
        if (tileMap[x][y].length === 1 || tries == 99) {
            if (tries === 99) console.log("100 tries to place new user!");
            entities[client.id] = newEntity(client.id, x, y, null);
            break;
        }
    }

    sendUpdate({id: client.id, x: entities[client.id].x, y: entities[client.id].y, solid: true}, wsServer.clients);

    client.on('message', message => {

        try {

          let data = JSON.parse(message);

          if (DEBUG) console.log(client.id + " --> " + message);

          if (data.hasOwnProperty("spawn")) {

              entityCount++;
              let n = {id: entityCount, x: entities[client.id].x, y: entities[client.id].y, solid: true};
              entities[n.id] = newEntity(n.id, n.x, n.y, data.script);

              sendUpdate(n, wsServer.clients);

              if (data.spawn !== "") {
                  entities[n.id].spawn = data.spawn;
                  try {
                      //console.log(">>> SPAWNING: " + data.spawn);
                      entities[n.id].vm.run(data.spawn);
                      entities[n.id].ready = true;
                   } catch (vmError) {
                       let entityUpdate = {id: n.id, error: vmError.message};
                       sendUpdate(entityUpdate, wsServer.clients);
                   }
               } else {
                   entities[n.id].spawn = null;
               }

          } else if (data.hasOwnProperty("delete")) {

              let isClient = false;
              for (let c of wsServer.clients) {
                  if (String(c.id) === data.delete) isClient = true;
                  break;
              }

              if (!isClient) {

                  for (let id of Object.keys(entities)) {
                      if (id === String(data.delete)) {
                          let deleteData = {delete: data.delete};
                          for (let c of wsServer.clients) {
                              c.send(JSON.stringify(deleteData));
                          }
                          delete entities[data.delete];
                          break;
                      }
                  }
              }

          } else if (data.hasOwnProperty("tile")) {

              let x, y, z;

              if (data.hasOwnProperty("x")) x = data.x;
              if (x < 0) x = 0;
              if (x > MAP_SIZE) x = MAP_SIZE;

              if (data.hasOwnProperty("y")) y = data.y;
              if (y < 0) y = 0;
              if (y > MAP_SIZE) y = MAP_SIZE;

              if (data.hasOwnProperty("z")) z = data.z;
              if (z < 0) z = 0;
              if (z > 11) z = 11;

              if (x !== undefined && y !== undefined) {
                  if (data.tile === -1 && tileMap[x][y].length > 0) {
                      if (z === tileMap[x][y].length - 1) {
                          tileMap[x][y].pop();
                          let n = tileMap[x][y].length - 1;
                          while (n >= 0) {
                              if (tileMap[x][y][n] == null) {
                                  tileMap[x][y].pop();
                              } else {
                                  break;
                              }
                              n--;
                          }
                      } else {
                          tileMap[x][y][z] = null;
                      }
                      if (tileMap[x][y].length === 1 && tileMap[x][y][0] === null) tileMap[x][y][z] = [];
                  } else {
                      if (data.tile === -2) data.tile = null;
                      if (z < tileMap[x][y].length) {
                          tileMap[x][y][z] = data.tile;
                      } else {
                          for (let n = tileMap[x][y].length; n < z; n++) {
                              tileMap[x][y].push(null);
                          }
                          tileMap[x][y].push(data.tile);
                      }
                  }

                  sendTileStack(x, y, tileMap[x][y], wsServer.clients);
              }

          } else {

              let lastX = entities[client.id].x;
              let lastY = entities[client.id].y;
              let lastT = entities[client.id].t;
              let reset = false;

              let entityUpdate = {id: client.id};

              if (data.hasOwnProperty("x")) {
                  entities[client.id].x = data.x;
                  entityUpdate.x = data.x;
              }

              if (data.hasOwnProperty("y")) {
                  entities[client.id].y = data.y;
                  entityUpdate.y = data.y;
              }

              if (data.hasOwnProperty("x") || data.hasOwnProperty("y")) {
                  let t = Date.now() - serverStartTime + entities[client.id].moveTime;
                  entities[client.id].t = t;
                  entityUpdate.t = t;
              }

              let u = entities[client.id].x;
              let v = entities[client.id].y;

              if (u < 1 || u > MAP_SIZE-1 || v < 1 || v > MAP_SIZE-1) reset = true;

              if (entities[client.id].solid) {
                  if (tileMap[u][v].length > 1 && !(
                      tileMap[u][v].length >= 3 &&
                      tileMap[u][v][1] === null &&
                      tileMap[u][v][2] === null)) reset = true;
                  if (u !== lastX && !passableTile(lastX, v, client.id)) reset = true;
                  if (v !== lastY && !passableTile(u, lastY, client.id)) reset = true;
                  if (!passableTile(u, v, client.id)) reset = true;
              }

              let d = Math.sqrt(Math.pow(lastX - u, 2) + Math.pow(lastY - v, 2));
              if (d >= 2) reset = true;

              if (entities[client.id].solid) {
                  for (let id of Object.keys(entities)) {
                      if (id === String(client.id) || !entities[id].solid) continue;
                      if (entities[id].x === u && entities[id].y === v) reset = true;
                  }
              }

              if (reset) {
                  entities[client.id].x = lastX;
                  entities[client.id].y = lastY;
                  entities[client.id].t = lastT;
                  entityUpdate.x = lastX;
                  entityUpdate.y = lastY;
                  entityUpdate.t = lastT;
              }

              if (data.hasOwnProperty("chat")) {

                  if (data.chat.length > 64) data.chat = data.chat.subString(0, 64);
                  let t = Date.now() - serverStartTime + CHAT_LIFE;

                  entities[client.id].chat = data.chat;
                  entities[client.id].chattime = t;

                  entityUpdate.chattime = t;
                  entityUpdate.chat = data.chat;

              }

              if (data.hasOwnProperty("image")) {
                  entities[client.id].image = data.image;
                  entityUpdate.image = data.image;
              }

              if (data.hasOwnProperty("name")) {

                  if (data.name.length > 64) data.name = data.name.subString(0, 64);

                  let count = 0;
                  for (let id of Object.keys(entities)) {
                      if (id !== client.id && entities[id].originalName === data.name) count++;
                  }

                  entities[client.id].originalName = data.name;
                  if (count > 0) data.name += " (" + (count + 1) + ")";
                  entities[client.id].name = data.name;
                  entityUpdate.name = data.name;

              }

              sendUpdate(entityUpdate, wsServer.clients);

          }

        } catch(err) {

          console.log("ERROR: " + err.stack);

        }

    });

    client.on('close', () => {

        console.log(`Client ${client.id} disconnected!`);

        let deleteData = {delete: client.id};
        for (let c of wsServer.clients) {
            c.send(JSON.stringify(deleteData));
        }
        delete entities[client.id];
    });


});

function sendUpdate(entity, clients) {
    let broadcast = JSON.stringify(entity);
    for (let c of clients) {
        c.send(broadcast);
    }
}

function sendTileStack(x, y, stack, clients) {
    let broadcast = JSON.stringify({x, y, stack});
    for (let c of clients) {
        c.send(broadcast);
    }
}

function newVM(id) {

    return new NodeVM({sandbox: {

        getPosition: function() {
            return {
                x: entities[id].x,
                y: entities[id].y
            };
        },

        move: function(dx, dy) {
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {

              let u = entities[id].x + dx;
              let v = entities[id].y + dy;

              if (u < 1 || v < 1 || u > MAP_SIZE-1 || v > MAP_SIZE-1) return;
              if (u !== entities[id].x && !passableTile(entities[id].x, v, id)) return;
              if (v !== entities[id].y && !passableTile(u, entities[id].y, id)) return;
              if (!passableTile(u, v, id)) return;

              entities[id].x = u;
              entities[id].y = v;

              entities[id].t = Date.now() - serverStartTime + entities[id].moveTime;
              sendUpdate({id, x: entities[id].x, y: entities[id].y, t: entities[id].t}, wsServer.clients);

            }
        },

        getPath: function(targetX, targetY) {
            return calculatePath(entities[id].x, entities[id].y, targetX, targetY);
        },

        moved: function() {
            return (entities[id].t < Date.now() - serverStartTime);
        },

        getSpeed: function() {
            return 1000 / entities[id].moveTime;
        },

        setSpeed: function(speed) {
            if (speed < 0.1) speed = 0.1;
            if (speed > 10) speed = 10;
            entities[id].moveTime = 1000 / speed;
        },

        listNearby: function(radius) {

            let list = [];
            let u = entities[id].x;
            let v = entities[id].y;
            for (let i of Object.keys(entities)) {
                if (i === String(id)) continue;
                let e = entities[i];
                let d = Math.sqrt(Math.pow(u - e.x, 2) + Math.pow(v - e.y, 2));
                if (d <= radius && d <= 12) {
                    list.push({
                      x: e.x,
                      y: e.y,
                      name: e.name,
                      chat: e.chat,
                      group: e.group,
                      image: e.image,
                      solid: e.solid,
                      speed: e.speed
                    });
                }
            }
            return list;

        },

        worldTime: function() {
            return Date.now() - serverStartTime;
        },

        setImage: function(image) {
            entities[id].image = image;
            sendUpdate({id, image}, wsServer.clients);
        },

        getImage: function() {
            return entities[id].image;
        },

        getFlag: function(flag) {
            return entities[id].flags[flag];
        },

        setFlag: function(flag, value) {
            entities[id].flags[flag] = value;
        },

        getStack: function(dx, dy) {

            if (dx >= -2 && dy >= -2 && dx <= 2 && dy <= 2) {
                let u = entities[id].x + dx;
                let v = entities[id].y + dy;
                if (u >= 0 && v >= 0 && u <= MAP_SIZE && v <= MAP_SIZE) {
                    return tileMap[u][v];
                }
            }

        },

        setStack: function(dx, dy, stack) {

            if (!Array.isArray(stack)) throw "Stack is not a valid array";

            if (stack.length > 12) throw "Stack is too long";
            for (let t of stack) {
                if (t === null) continue;
                if (typeof t === 'number') continue;
                throw "Stack entry is not null or a number";
            }

            if (dx >= -2 && dy >= -2 && dx <= 2 && dy <= 2) {
                let u = entities[id].x + dx;
                let v = entities[id].y + dy;
                if (u >= 0 && v >= 0 && u <= MAP_SIZE && v <= MAP_SIZE) {
                    tileMap[u][v] = stack;
                    sendTileStack(u, v, tileMap[u][v], wsServer.clients);
                }
            }

        },

        setSolid: function(solid) {
            if (solid !== true && solid !== false) return;
            entities[id].solid = solid;
            sendUpdate({id, solid}, wsServer.clients);
        },

        setGroup: function(group) {
            if (groupFlags[group] === undefined) groupFlags[group] = {};
            entities[id].group = group;
        },

        getGroup: function() {
            return entities[id].group;
        },

        getGroupFlag: function(flag) {
            if (entities[id].group === undefined || entities[id].group === "") {
                return undefined;
            } else if (groupFlags[entities[id].group] === undefined) {
                return undefined;
            } else {
                return groupFlags[entities[id].group][flag];
            }
        },

        setGroupFlag: function(flag, value) {
            if (groupFlags[entities[id].group] !== undefined) {
                groupFlags[entities[id].group][flag] = value;
            }
        },

        say: function(text) {
            if (text !== entities[id].chat || entities[id].chattime < (Date.now() - serverStartTime) + 100) {
                entities[id].chat = text;
                entities[id].chattime = (Date.now() - serverStartTime) + CHAT_LIFE;
                sendUpdate({id, chat: entities[id].chat, chattime: entities[id].chattime}, wsServer.clients);
            }
        },

        spawn: function(dx, dy, s0, s) {
          if (dx >= -2 && dy >= -2 && dx <= 2 && dy <= 2) {
              let u = entities[id].x + dx;
              let v = entities[id].y + dy;
              if (u >= 0 && v >= 0 && u <= MAP_SIZE && v <= MAP_SIZE) {

                entityCount++;
                let n = {id: entityCount, x: u, y: v, solid: true};
                entities[n.id] = newEntity(n.id, n.x, n.y, s);

                sendUpdate(n, wsServer.clients);

                if (s0 !== "") {
                    try {
                        entities[n.id].spawn = s0;
                        entities[n.id].vm.run(s0);
                        entities[n.id].ready = true;
                     } catch (vmError) {
                         let entityUpdate = {id: n.id, error: vmError.message};
                         sendUpdate(entityUpdate, wsServer.clients);
                     }
                 } else {
                     entities[n.id].spawn = null;
                 }

              }
            }
        },

        selfDestruct: function() {
            let deleteData = {delete: id};
            for (let c of wsServer.clients) {
                c.send(JSON.stringify(deleteData));
            }
            delete entities[id];
        }

    }});

}

function newEntity(id, x, y, script) {

    if (script === undefined) script = null;
    let compiledScript;
    if (script !== null) compiledScript = new VMScript(script);
    return {x, y, script, ready:false, t: 0, chat: "", chattime: 0, moveTime: 200, flags: {}, solid: true, group: "", vm: newVM(id), compiledScript};

}

function passableTile(x, y, i) {

    for (let id of Object.keys(entities)) {
        if (String(i) === id) continue;
        if (!entities[id].solid) continue;
        if (x === entities[id].x && y === entities[id].y) return false;
    }

    if (tileMap[x][y].length <= 1) return true;
    if (tileMap[x][y].length >= 3 && tileMap[x][y][1] === null && tileMap[x][y][2] === null) return true;

    return false;

}

function calculatePath(startX, startY, endX, endY, id) {

    let nodes = [];

    if (endX < 1 || endY < 1 || endX > MAP_SIZE-1 || endY > MAP_SIZE-1) return [];
    if (!passableTile(endX, endY, id)) return [];

    let adjacencies = [{x: 0, y:-1, g:10}, {x:  1, y:-1, g:14}, {x: 1, y:0, g:10}, {x: 1, y: 1, g:14},
                       {x: 0, y: 1, g:10}, {x: -1, y: 1, g:14}, {x:-1, y:0, g:10}, {x:-1, y:-1, g:14}];

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

        if (current === undefined) return [];

        adjs:
        for (let adj of adjacencies) {

            let x = current.x + adj.x;
            let y = current.y + adj.y;

            if (x < 1 || y < 1 || x > MAP_SIZE-1 || y > MAP_SIZE-1) continue;

            if (!passableTile(x, y, id)) continue;
            if (adj.x !== 0 && adj.y !== 0) {
                if (!passableTile(current.x, y, id)) continue;
                if (!passableTile(x, current.y, id)) continue;
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
