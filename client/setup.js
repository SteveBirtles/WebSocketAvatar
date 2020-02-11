"use strict";

const TILE_COUNT = 176;
const ITEM_COUNT = 50;
const AVATAR_COUNT = 43;
const MAP_SIZE = 128;
const TILE_SOURCE_SIZE = 64;

let selectedAvatar;
let recentScripts = [];

function pageLoad() {

    console.log("*** Preparing choices screen... ***");

    let tileDiv = document.getElementById("tilesDiv");

    let tileHTML = '';

    for (let i = 0; i < TILE_COUNT; i++) {
        tileHTML += `<img src="/client/tiles/tile${i}.png" id="tile${i}" class="tile">`;
    }

    tileDiv.innerHTML = tileHTML;

    for (let i = 0; i < TILE_COUNT; i++) {
      tiles.push(document.getElementById("tile" + i));
    }

    let itemsDiv = document.getElementById("itemsDiv");

    let itemsHTML = '';

    for (let i = 1; i <= ITEM_COUNT; i++) {
        itemsHTML += `<img src="/client/items/item${i}.png" id="item${i}" class="item">`;
    }

    itemsDiv.innerHTML = itemsHTML;


    for (let x = 0; x <= MAP_SIZE; x++) {
      let row = [];
      for (let y = 0; y <= MAP_SIZE; y++) {
        row.push([]);
      }
      tileMap.push(row);
    }

    let pickerDiv = document.getElementById("avatarPicker");

    let pickerHTML = "<h1>Welcome! Please choose your avatar:</h1>";

    for (let i = 1; i <= AVATAR_COUNT; i++) {
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

    shadow.src = "/client/shadow.png";

    let joinButton = document.getElementById("joinButton");

    joinButton.addEventListener("click", checkChoices);

    document.getElementById("avatarName").addEventListener("keyup", event => {
        if (event.key == "Enter") checkChoices();
    });

}

function checkChoices() {

    console.log("*** Checking choices... ***");

    let pickerDiv = document.getElementById("avatarPicker");

    if (selectedAvatar === undefined) {
      alert("Please pick an avatar!");
      return;
    }
    if (document.getElementById("avatarName").value.trim() == "") {
      alert("Please choose a name!");
      return;
    }
    if (document.getElementById("avatarName").value.length > 64) {
      alert("Your name is too long!");
      return;
    }
    document.getElementById("content").style.display = "none";
    document.getElementById("avatarCanvas").style.display = "block";

    joinGame();

}

function joinGame() {

    console.log("*** Attempting to join game... ***");

    let protocol = window.location.protocol.toLowerCase().replace('http', 'ws');
    let host = window.location.hostname;
    let port = window.location.port;

    connection = new WebSocket(protocol + '//' + host + ':' + port);

    connection.addEventListener('message', receiveMessage);
    connection.addEventListener('error', () => alert("There was an error connecting to the server."));
    connection.addEventListener('close', () => alert("Connection to the server was lost."));

    window.addEventListener("keydown", event => pressedKeys[event.key] = true);
    window.addEventListener("keyup", event => pressedKeys[event.key] = false);

    document.getElementById("chattext").addEventListener("keyup", chat);

    document.getElementById("spawn").addEventListener("keyup", event => {
        if (event.key == "Enter" && pressedKeys["Control"]) newEntity();
    });
    document.getElementById("script").addEventListener("keyup", event => {
        if (event.key == "Enter" && pressedKeys["Control"]) newEntity();
    });

    document.getElementById("newentitybutton").addEventListener("click", newEntity);

    const canvas = document.getElementById('avatarCanvas');

    canvas.addEventListener('mousemove', event => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
    }, false);

    canvas.addEventListener('mousedown', event => {
        if (event.button === 0) {
            leftMouseDown = true;
        } else if (event.button === 2) {
            rightMouseDown = true;
        } else if (event.button === 1) {
            middleMouseDown = true;
        }
    }, false);

    canvas.addEventListener('mouseup', event => {
        if (event.button === 0) {
            leftMouseDown = false;
        } else if (event.button === 2) {
            rightMouseDown = false;
        } else if (event.button === 1) {
            middleMouseDown = false;
        }
    }, false);

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    canvas.addEventListener('wheel', event => {
        selectedTile += Math.sign(event.deltaY);
        if (selectedTile < 0) selectedTile += TILE_COUNT;
        if (selectedTile >= TILE_COUNT) selectedTile -= TILE_COUNT;
    }, false);

    fixSize();
    window.addEventListener("resize", fixSize);

    let recentScriptsJSON = localStorage.getItem("recentScripts");
    if (recentScriptsJSON !== undefined && recentScriptsJSON !== null) {
        recentScripts = JSON.parse(recentScriptsJSON);
    }

    console.log("*** Requesting animation frame... ***");
    window.requestAnimationFrame(gameFrame);

}
