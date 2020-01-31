const MAP_SIZE = 128;
const MAP_FILE = "map.json";
const BASE_TILE = 0;

const express = require('express');
const http = require('http');
const ws = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server({server});

let serverStartTime;
let clientCount = 0;
let avatars = {};

let tileMap = [];

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

      console.log("*** SAVING MAP (" + (Date.now() - serverStartTime) + ") ***");

      fs.writeFile('map.json', JSON.stringify(tileMap), function(err) {
          if (err) throw err;
      });

  }, 30000);

});

wsServer.on('connection', client => {

    clientCount++;
    client.id = clientCount;

    console.log(`Client ${client.id} connected!`);

    for (let id of Object.keys(avatars)) {
        sendAvatar(id, [client]);
    }
    for (let x = 0; x <= MAP_SIZE; x++) {
      for (let y = 0; y <= MAP_SIZE; y++) {
          sendTileStack(x, y, tileMap[x][y], [client]);
      }
    }

    avatars[client.id] = {id: client.id, x: Math.floor(MAP_SIZE/2), y: Math.floor(MAP_SIZE/2), t: 0, chat: "", chattime: 0};

    let newClientData = {you: client.id, serverTime: Date.now() - serverStartTime};
    client.send(JSON.stringify(newClientData));

    client.on('message', message => {

        let data = JSON.parse(message);

        console.log(client.id + " --> " + message);

        if (data.hasOwnProperty("tile")) {

            let x, y;

            if (data.hasOwnProperty("x")) x = data.x;
            if (x < 1) x = 1;
            if (x > MAP_SIZE-1) x = MAP_SIZE-1;

            if (data.hasOwnProperty("y")) y = data.y;
            if (y < 1) y = 1;
            if (y > MAP_SIZE-1) y = MAP_SIZE-1;

            if (x !== undefined && y !== undefined) {
                if (data.tile === -1 && tileMap[x][y].length > 0) {
                    tileMap[x][y].pop();
                } else {
                    tileMap[x][y].push(data.tile);
                }

                sendTileStack(x, y, tileMap[x][y], wsServer.clients);
            }

        } else {

            let lastX = avatars[client.id].x;
            let lastY = avatars[client.id].y;
            let reset = false;

            if (data.hasOwnProperty("x")) avatars[client.id].x = data.x;
            if (data.hasOwnProperty("y")) avatars[client.id].y = data.y;

            if (avatars[client.id].x < 1 ||
                avatars[client.id].x > MAP_SIZE-1 ||
                avatars[client.id].y < 1 ||
                avatars[client.id].y > MAP_SIZE-1) reset = true;

            if (tileMap[avatars[client.id].x][avatars[client.id].y].length > 1) reset = true;

            for (let id of Object.keys(avatars)) {
                console.log("id - " + typeof id + ", client - " + typeof client.id);
                if (id === String(client.id)) continue;
                if (avatars[id].x === avatars[client.id].x && avatars[id].y === avatars[client.id].y) reset = true;
            }

            if (reset) {
                console.log("Reset : " + client.id);
                avatars[client.id].x = lastX;
                avatars[client.id].y = lastY;
            }

            if (data.hasOwnProperty("t")) avatars[client.id].t = data.t;

            if (data.hasOwnProperty("chat")) avatars[client.id].chat = data.chat;
            if (data.hasOwnProperty("chattime")) avatars[client.id].chattime = data.chattime;

            if (data.hasOwnProperty("image")) avatars[client.id].image = data.image;
            if (data.hasOwnProperty("name")) avatars[client.id].name = data.name;

            sendAvatar(client.id, wsServer.clients);

        }

    });

    client.on('close', () => {

        console.log(`Client ${client.id} disconnected!`);

        let deleteData = {delete: client.id};
        for (let c of wsServer.clients) {
            c.send(JSON.stringify(deleteData));
        }
        delete avatars[client.id];
    });


});

function sendAvatar(id, clients) {
    let broadcast = JSON.stringify(avatars[id]);
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
