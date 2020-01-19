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

let startTime;

function gameFrame(frameTime) {

    if (startTime === undefined) startTime = frameTime;

    console.log(Math.floor(frameTime - startTime));

    let x = Math.random() * 1000;
    let y = Math.random() * 750;
    let i = Math.floor(Math.random() * 43) + 1;

    let canvas = document.getElementById("avatarCanvas");
    let context = canvas.getContext("2d");
    let image = document.getElementById("avatar" + i);

    context.drawImage(image, x, y);

    window.requestAnimationFrame(gameFrame);

}

function sendMessage(message) {

    connection.send(message);

}

function receiveMessage(event) {

    console.log(event.data);

}
