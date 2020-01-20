let selectedAvatar;

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
        pickerDiv.style.display = "none";
        avatarCanvas.style.display = "block";
        avatarCanvas.width = 1000;
        avatarCanvas.height = 750;
        avatarCanvas.style.backgroundColor = "silver";

        joinGame();

    });

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

}

let clientStartTime;
let clientJoinTime;
let clientTime;
let serverTime;


function gameFrame(frameTime) {

    clientTime = Math.floor(frameTime);

    if (clientJoinTime !== undefined) {

      if (clientStartTime === undefined) clientStartTime = clientTime;

      let x = 100;
      let y = 200;

      let canvas = document.getElementById("avatarCanvas");
      let context = canvas.getContext("2d");
      let image = document.getElementById("avatar1");

      context.drawImage(image, x, y);

      console.log(`(${clientTime} - ${clientStartTime}) = ${(clientTime - clientStartTime)}`);
      console.log(`(${serverTime} - ${clientJoinTime}) =  ${(serverTime - clientJoinTime)}`);

    }

    window.requestAnimationFrame(gameFrame);

}

function sendMessage(message) {

    connection.send(message);

}


function receiveMessage(event) {

    let payload = JSON.parse(event.data);

    serverTime = payload.serverTime;

    if (clientJoinTime === undefined) clientJoinTime = serverTime;

}
