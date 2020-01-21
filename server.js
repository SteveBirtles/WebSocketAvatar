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

    let timeData = {serverTime : Date.now() - serverStartTime};
    let broadcast = JSON.stringify(timeData);
    for (let c of wsServer.clients) {
        c.send(broadcast);
    }

    console.log(broadcast);

}, 1000);

});


let clientCount = 0;

let avatars = {};

wsServer.on('connection', client => {

    clientCount++;
    client.id = clientCount;

    console.log(`Client ${client.id} connected!`);

    let newClientData = {you: client.id, serverTime: Date.now() - serverStartTime};
    client.send(JSON.stringify(newClientData));

    for (let id of Object.keys(avatars)) {
        sendAvatar(id, [client]);
    }
    avatars[client.id] = {id: client.id, x: 0, y: 0, t: 0, chat: "", chattime: 0};

    client.on('message', message => {

        let data = JSON.parse(message);

        console.log(client.id + " --> " + message);

        if (data.hasOwnProperty("x")) avatars[client.id].x = data.x;
        if (data.hasOwnProperty("y")) avatars[client.id].y = data.y;
        if (data.hasOwnProperty("t")) avatars[client.id].t = data.t;
        if (data.hasOwnProperty("chat")) avatars[client.id].chat = data.chat;
        if (data.hasOwnProperty("chattime")) avatars[client.id].chattime = data.chattime;
        if (data.hasOwnProperty("image")) avatars[client.id].image = data.image;
        if (data.hasOwnProperty("name")) avatars[client.id].name = data.name;

        sendAvatar(client.id, wsServer.clients);

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
