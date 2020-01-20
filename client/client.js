let selectedAvatar;
let pressedKeys = {};

let avatars = [];

function pageLoad() {

    let pickerDiv = document.getElementById("avatarPicker");

    let pickerHTML = "<h1>Welcome! Please choose your avatar:</h1>";

    for (let i = 1; i <= 43; i++) {
        pickerHTML += `<img src="/client/avatars/${i}.png" id="avatar${i}" class="avatar">`;
    }

    pickerHTML += `<div id="pickerInputDiv">`
    pickerHTML += `<input type="text" placeholder="Your name" id="avatarName"></input>`
    pickerHTML += `<button id="joinButton">Join</button>`;
    pickerHTML += `</div>`

    pickerDiv.innerHTML = pickerHTML;

    let avatars = document.getElementsByClassName("avatar");
    for (let avatar of avatars) {
        avatar.addEventListener("click", event => {
            if (selectedAvatar !== undefined) selectedAvatar.classList.remove("selectedAvatar");
            selectedAvatar = event.target;
            selectedAvatar.classList.add("selectedAvatar");
        });
    }

    let joinButton = document.getElementById("joinButton");
    let avatarCanvas = document.getElementById("avatarCanvas");
    joinButton.addEventListener("click", () => {
        if (selectedAvatar === undefined) return;
        pickerDiv.style.display = "none";
        avatarCanvas.style.display = "block";
        avatarCanvas.width = 1000;
        avatarCanvas.height = 750;
        avatarCanvas.style.backgroundColor = "silver";

        joinGame();

    });

    window.addEventListener("keydown", event => pressedKeys[event.key] = true);
    window.addEventListener("keyup", event => pressedKeys[event.key] = false);

}

let connection;

function joinGame() {

    let protocol = window.location.protocol.toLowerCase().replace('http', 'ws');
    let host = window.location.hostname;
    let port = window.location.port;

    connection = new WebSocket(protocol + '//' + host + ':' + port);

    connection.addEventListener('message', receiveMessage);
    connection.addEventListener('error', event => alert(event));

    window.requestAnimationFrame(gameFrame);

    myX = Math.floor(Math.random() * 1000);
    myY = Math.floor(Math.random() * 750);

}

let clientStartTime;
let serverJoinTime;
let clientTime;
let serverTime;

let myX;
let myY;
let myId;

function gameFrame(frameTime) {

    clientTime = Math.floor(frameTime);

    if (serverJoinTime !== undefined) {

      if (clientStartTime === undefined) clientStartTime = clientTime;

      let serverClientTimeDif = (clientTime - clientStartTime) - (serverTime - serverJoinTime);

    }

    let lastX = myX;
    let lastY = myY;

    if (pressedKeys["ArrowUp"]) {
        myY -= 10;
    }
    if (pressedKeys["ArrowDown"]) {
        myY += 10;
    }
    if (pressedKeys["ArrowLeft"]) {
        myX -= 10;
    }
    if (pressedKeys["ArrowRight"]) {
        myX += 10;
    }

    if (lastX != myX || lastY != myY) {
        sendMessage(`{"x":${myX}, "y":${myY}}`);
    }

    let canvas = document.getElementById("avatarCanvas");
    let context = canvas.getContext("2d");

    context.clearRect(0,0,1000,750);

    context.drawImage(selectedAvatar, myX, myY);

    for (let avatar of avatars) {
        if (avatar.id != myId && avatar.image != null) {
            context.drawImage(avatar.image, avatar.x, avatar.y);
        }
    }

    window.requestAnimationFrame(gameFrame);

}

function sendMessage(message) {

    connection.send(message);

}


function receiveMessage(event) {

    let data = JSON.parse(event.data);

    if (data.hasOwnProperty("you")) {
        myId = data.you;
        console.log("Connected and given id of " + myId);

        sendMessage(`{"x":${myX}, "y":${myY}, "image": "${selectedAvatar.id}"}`);

    }

    if (data.hasOwnProperty("serverTime")) {
        serverTime = data.serverTime;
        if (serverJoinTime === undefined) serverJoinTime = serverTime;
    }

    if (data.hasOwnProperty("id") && data.id != myId) {

        console.log(event.data);

        let newAvatar = true;
        for (let avatar of avatars) {
            if (avatar.id == data.id) {
                newAvatar = false;
                break;
            }
        }
        if (newAvatar) avatars.push({id: data.id});


        for (let avatar of avatars) {
            if (avatar.id == data.id) {
                if (data.hasOwnProperty("x")) avatar.x = data.x;
                if (data.hasOwnProperty("y")) avatar.y = data.y;
                if (data.hasOwnProperty("image")) {
                    console.log("...." + data.image);
                    avatar.image = document.getElementById(data.image);
                }
            }
        }

    }

}
