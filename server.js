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
    let broadcast = `{"serverTime" : ${Date.now() - serverStartTime}}`;
    console.log(broadcast);
    for (let client of wsServer.clients) {
        client.send(broadcast);
    }
  }, 50);

});


let clientCount = 0;

wsServer.on('connection', client => {

    clientCount++;
    client.id = clientCount;
    client.send(`{"id":${client.id}}`);

    client.on('message', message => {
    });

    client.on('close', () => {
    });

});
