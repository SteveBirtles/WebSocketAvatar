const express = require('express');
const http = require('http');
const ws = require('ws');
const uuidv4 = require('uuid/v4');

const app = express();
const server = http.createServer(app);
const wsServer = new ws.Server({server});

const port = 8081;

app.use('/client', express.static('client'));

server.listen(port, function(){
  console.log(`Server started on port ${port}`);
});


wsServer.on('connection', client => {

    client.id = uuidv4();
    client.send(`<strong>Welcome!</strong> You are client ${client.id}.`);

    let greeting = `<strong>Client ${client.id} joined!</strong>`;
    for (let c of wsServer.clients) {
        if (c != client) c.send(greeting);
    }
    console.log(greeting);

    client.on('message', message => {

        let broadcast = `<strong>Client ${client.id}:</strong> ${message}`;
        for (let c of wsServer.clients) {
            if (c != client) c.send(broadcast);
        }
        console.log(broadcast);

    });

    client.on('close', () => {

      let farewell = `<strong>Client ${client.id} disconnected!</strong>`;
      for (let c of wsServer.clients) {
          if (c != client) c.send(farewell);
      }
      console.log(farewell);

    });

});
