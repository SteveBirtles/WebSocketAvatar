const express = require('express');
const http = require('http');
const ws = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server({server});

const port = 8081;

app.use('/client', express.static('client'));

let serverStartTime;
server.listen(port, function(){

  console.log(`Server started on port ${port}`);

  serverStartTime = Date.now();

  setInterval(() => {

    if (wsServer.clients.length === 0) return;

    let now = Date.now();

    let broadcast = `{"serverTime" : ${now - serverStartTime}}`;
    for (let client of wsServer.clients) {
        client.send(broadcast);
    }

  }, 50);

});


let clientCount = 0;

let avatars = [];

wsServer.on('connection', client => {

    clientCount++;
    client.id = clientCount;
    client.send(`{"you":${client.id}}`);

    for (let avatar of avatars) {
        client.send(`{"id": ${avatar.id}, "x": ${avatar.x}, "y": ${avatar.y}, "image": "${avatar.image}"}`);
    }

    avatars.push({id: client.id, x: 0, y: 0, image: ""});

    client.on('message', message => {

        let data = JSON.parse(message);

        if (data.hasOwnProperty("x") || data.hasOwnProperty("y") || data.hasOwnProperty("image")) {

            for (let avatar of avatars) {
                if (avatar.id == client.id) {

                    console.log(message);

                    if (data.hasOwnProperty("x")) avatar.x = data.x;
                    if (data.hasOwnProperty("y")) avatar.y = data.y;
                    if (data.hasOwnProperty("image")) avatar.image = data.image;

                    let broadcast = `{"id": ${avatar.id}, "x": ${avatar.x}, "y": ${avatar.y}, "image": "${avatar.image}"}`;
                    for (let otherClient of wsServer.clients) {
                        if (otherClient.id != client.id) {
                            otherClient.send(broadcast);
                        }
                    }
                    console.log(broadcast);

                }
            }

        }

    });

    client.on('close', () => {
    });

});
