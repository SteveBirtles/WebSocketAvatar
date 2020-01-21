const moveTime = 200;
const chatLifespan = 2000;

let pressedKeys = {};

let connection;

let clientTime;
let lastUpdateTime;
let lastServerTime;
let worldTime;
let lastClientTime;

let selectedAvatar;
let myId;
let avatars = {};
let chatting = false;

function pageLoad() {

    let pickerDiv = document.getElementById("avatarPicker");

    let pickerHTML = "<h1>Welcome! Please choose your avatar:</h1>";

    for (let i = 1; i <= 43; i++) {
        pickerHTML += `<img src="/client/avatars/${i}.png" id="avatar${i}" class="avatar">`;
    }

    pickerHTML += '<div id="pickerInputDiv">';
    pickerHTML += '<input type="text" placeholder="Your name" id="avatarName"></input>';
    pickerHTML += '<button id="joinButton">Join</button>';
    pickerHTML += '</div>';

    pickerDiv.innerHTML = pickerHTML;

    let avatarImages = document.getElementsByClassName("avatar");
    for (let ai of avatarImages) {
        ai.addEventListener("click", event => {
            if (selectedAvatar !== undefined) selectedAvatar.classList.remove("selectedAvatar");
            selectedAvatar = event.target;
            selectedAvatar.classList.add("selectedAvatar");
            document.getElementById("avatarName").focus();
        });
    }

    let joinButton = document.getElementById("joinButton");

    joinButton.addEventListener("click", checkChoices);

    document.getElementById("avatarName").addEventListener("keyup", event => {
        if (event.key == "Enter") checkChoices();
    });

    window.addEventListener("keydown", event => pressedKeys[event.key] = true);
    window.addEventListener("keyup", event => pressedKeys[event.key] = false);

    document.getElementById("chattext").addEventListener("keyup", chat);

}

function checkChoices() {

    let pickerDiv = document.getElementById("avatarPicker");

    if (selectedAvatar === undefined) {
      alert("Please pick an avatar!");
      return;
    }
    if (document.getElementById("avatarName").value.trim() == "") {
      alert("Please choose a name!");
      return;
    }
    pickerDiv.style.display = "none";
    document.getElementById("canvasDiv").style.display = "block";
    joinGame();

}

function joinGame() {

    let protocol = window.location.protocol.toLowerCase().replace('http', 'ws');
    let host = window.location.hostname;
    let port = window.location.port;

    connection = new WebSocket(protocol + '//' + host + ':' + port);

    connection.addEventListener('message', receiveMessage);
    connection.addEventListener('error', event => alert(event));

    window.requestAnimationFrame(gameFrame);

}

function gameFrame(frameTime) {

    lastClientTime = clientTime;
    clientTime = Math.floor(frameTime);
    worldTime = lastServerTime + clientTime - lastUpdateTime;

    if (myId !== undefined && avatars[myId] !== undefined) {

        if (avatars[myId].currentX === avatars[myId].targetX &&
              avatars[myId].currentY === avatars[myId].targetY) {

            let moved = false;

            if (pressedKeys["Enter"] && !chatting) {
                chatting = true;
                document.getElementById("chat").style.display = "block";
                document.getElementById("chattext").focus();
            }

            if (!chatting) {
                if (pressedKeys["ArrowUp"]) {
                    avatars[myId].targetY -= 1;
                    moved = true;
                }
                if (pressedKeys["ArrowDown"]) {
                    avatars[myId].targetY += 1;
                    moved = true;
                }
                if (pressedKeys["ArrowLeft"]) {
                    avatars[myId].targetX -= 1;
                    moved = true;
                }
                if (pressedKeys["ArrowRight"]) {
                    avatars[myId].targetX += 1;
                    moved = true;
                }
                if (moved) {

                    avatars[myId].targetT = worldTime + moveTime;
                    avatars[myId].lastT = worldTime;

                    let data = {x: avatars[myId].targetX,
                                y: avatars[myId].targetY,
                                t: avatars[myId].targetT}

                    connection.send(JSON.stringify(data));

                }
            }

        }

    }

    let canvas = document.getElementById("avatarCanvas");
    let context = canvas.getContext("2d");

    context.clearRect(0,0,1024,768);

    context.strokeStyle = 'grey';

    for (let i = 32; i < 1024; i += 64) {
      context.beginPath();
      context.moveTo(i, 0);
      context.lineTo(i, 768);
      context.stroke();
    }

    for (let i = 24; i < 768; i += 48) {
      context.beginPath();
      context.moveTo(0, i);
      context.lineTo(1024, i);
      context.stroke();
    }

    for (let id of Object.keys(avatars)) {
        let avatar = avatars[id];

        if (worldTime >= avatar.targetT &&
            (avatar.currentX != avatar.targetX ||
              avatar.currentY != avatar.targetY)) {

            avatar.currentX = avatar.targetX;
            avatar.currentY = avatar.targetY;

        } else if (lastClientTime !== undefined) {

            let dx = (avatar.targetX - avatar.currentX) / (avatar.targetT - worldTime);
            let dy = (avatar.targetY - avatar.currentY) / (avatar.targetT - worldTime);
            let dt = clientTime - lastClientTime;

            if (!isNaN(dx)) avatar.currentX += dx * dt;
            if (!isNaN(dy)) avatar.currentY += dy * dt;

        }

        if (avatar.image !== undefined && avatar.image !== null && avatar.image !== "") {

            context.fillStyle = 'gray';
            context.beginPath();
            context.ellipse(Math.floor(avatar.currentX*64), Math.floor(avatar.currentY*48), 32, 24, 0, 0, 2*Math.PI);
            context.fill();

            context.drawImage(avatar.image,
                  Math.floor(avatar.currentX*64-32), Math.floor(avatar.currentY*48-128));

        }


        if (avatar.chattime !== undefined && avatar.chattime > worldTime) {

            context.fillStyle = 'blue';
            context.font = '24px Arial';
            context.textAlign = 'center';
            context.fillText(avatar.name + ": " + avatar.chat,
                  Math.floor(avatar.currentX*64), Math.floor(avatar.currentY*48-128));

        } else if (avatar.name !== undefined ) {

            context.fillStyle = 'grey';
            context.font = '24px Arial';
            context.textAlign = 'center';
            context.fillText(avatar.name,
                  Math.floor(avatar.currentX*64), Math.floor(avatar.currentY*48-128));

        }

    }

    window.requestAnimationFrame(gameFrame);

}

function receiveMessage(event) {

    let data = JSON.parse(event.data);

    if (data.hasOwnProperty("you")) {

        myId = data.you;
        console.log("Connected and given id of " + myId);

        let newAvatar = {x: Math.floor(Math.random() * 15) + 1,
                         y: Math.floor(Math.random() * 15) + 1,
                         t: 0,
                         image: selectedAvatar.id,
                         name: document.getElementById("avatarName").value};

        connection.send(JSON.stringify(newAvatar));

    }

    if (data.hasOwnProperty("id")) {

        if (avatars[data.id] === undefined) avatars[data.id] = {};

        if (data.hasOwnProperty("x")) avatars[data.id].targetX = data.x;
        if (data.hasOwnProperty("y")) avatars[data.id].targetY = data.y;
        if (data.hasOwnProperty("t")) avatars[data.id].targetT = data.t;

        if (data.hasOwnProperty("chat")) avatars[data.id].chat = data.chat;
        if (data.hasOwnProperty("chattime")) avatars[data.id].chattime = data.chattime;

        if (data.hasOwnProperty("image") && avatars[data.id].image === undefined)
                          avatars[data.id].image = document.getElementById(data.image);

        if (data.hasOwnProperty("name")) avatars[data.id].name = data.name;

        console.log(event.data);

    }

    if (data.hasOwnProperty("serverTime")) {

        lastServerTime = data.serverTime;
        lastUpdateTime = clientTime;

    }

    if (data.hasOwnProperty("delete")) {

        delete avatars[data.delete];

    }

}

function chat(event) {

    if (event.key == "Enter" && event.target.value != "") {
        let chatData = {chat: event.target.value, chattime: worldTime + chatLifespan}
        connection.send(JSON.stringify(chatData));

        event.target.value = "";
        document.getElementById("chat").style.display = "none";
        chatting = false;

    }

}
