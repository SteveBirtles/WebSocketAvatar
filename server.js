const MAP_SIZE = 128;
const MAP_FILE = "map.json";
const BASE_TILE = 0;

const chatLifespan = 5000;

const express = require('express');
const http = require('http');
const ws = require('ws');
const fs = require('fs');
const {NodeVM} = require('vm2');

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
        tileMap = JSON.parse(raw);
    })

} else {

    console.log("Creating blank map...");

    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([BASE_TILE]);
      }
      tileMap.push(row);
    }
    fs.writeFile('map.json', JSON.stringify(tileMap), function(err) {
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

          if (entity.script !== undefined && entity.script !== null && entity.script !== "") {
              try {
                  //console.log(">>> RUNNING: " + entity.script);
                   entities[entity.id].vm.run(entity.script);
               } catch (vmError) {
                   console.log(">>> VM ERROR: " + vmError.message);
               }
           }

      }

  }, 100);

  setInterval(() => {

      console.log("*** SAVING MAP (" + (Date.now() - serverStartTime) + ") ***");

      fs.writeFile('map.json', JSON.stringify(tileMap), function(err) {
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
            image: entities[id].image
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

    sendUpdate({id: client.id, x: entities[client.id].x, y: entities[client.id].y}, wsServer.clients);

    client.on('message', message => {

        try {

          let data = JSON.parse(message);

          console.log(client.id + " --> " + message);

          if (data.hasOwnProperty("spawn")) {

              entityCount++;
              let n = {id: entityCount, x: entities[client.id].x, y: entities[client.id].y};

              entities[n.id] = newEntity(n.id, n.x, n.y, data.script);

              sendUpdate(n, wsServer.clients);

              if (data.spawn !== "") {
                  try {
                      //console.log(">>> SPAWNING: " + data.spawn);
                       entities[n.id].vm.run(data.spawn);
                   } catch (vmError) {
                       console.log(">>> VM ERROR: " + vmError.message);
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

              if (entities[client.id].x < 1 ||
                  entities[client.id].x > MAP_SIZE-1 ||
                  entities[client.id].y < 1 ||
                  entities[client.id].y > MAP_SIZE-1) reset = true;

              if (tileMap[entities[client.id].x][entities[client.id].y].length > 1 && !(
                  tileMap[entities[client.id].x][entities[client.id].y].length >= 3 &&
                  tileMap[entities[client.id].x][entities[client.id].y][1] === null &&
                  tileMap[entities[client.id].x][entities[client.id].y][2] === null)) reset = true;

              let d = Math.sqrt(Math.pow(lastX - entities[client.id].x, 2) + Math.pow(lastY - entities[client.id].y, 2));
              if (d >= 2) {
                console.log("Toooooo fast!");
                reset = true;
              }

              for (let id of Object.keys(entities)) {
                  if (id === String(client.id)) continue;
                  if (entities[id].x === entities[client.id].x && entities[id].y === entities[client.id].y) reset = true;
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
                  let t = Date.now() - serverStartTime + chatLifespan;

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

          console.log("ERROR: " + err);

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

function newEntity(id, x, y, script) {

    if (script === undefined) script = null;

    return {

        id, x, y, script,

        t: 0, chat: "", chattime: 0, moveTime: 200, flags: {}, solid: true, group: "",

        vm: new NodeVM({sandbox: {

            getPosition: function() {
                return {
                    x: entities[id].x,
                    y: entities[id].y
                };
            },

            move: function(dx, dy) {
                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                    entities[id].x += dx;
                    entities[id].y += dy;
                    entities[id].t = Date.now() - serverStartTime + entities[id].moveTime;
                    sendUpdate({id, x: entities[id].x, y: entities[id].y, t: entities[id].t}, wsServer.clients);
                }
            },

            moved: function() {
                return (entities[id].t < Date.now() - serverStartTime);
            },

            getSpeed: function() {
                return 1000 / entities[id].moveTime;
            },

            setSpeed: function(speed) {
                entities[id].moveTime = 1000 / speed;
            },

            listNearby: function(radius) {
                // !!!
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
                // !!!
            },

            setStack: function(dx, dy, stack) {
                // !!!
            },

            setSolid: function(solidity) {
                entities[id].solid = solidity;
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
                entities[id].chat = text;
                entities[id].chattime = Date.now() - serverStartTime + chatLifespan;
                sendUpdate({id, chat: entities[id].chat, chattime: entities[id].chattime}, wsServer.clients);
            },

            selfDestruct: function() {
                // !!!
            }

        }})

    };

}
