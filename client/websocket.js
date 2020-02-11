let connection;

function chat(event) {

    if (event.key == "Enter" && event.target.value != "") {

        let text = event.target.value;
        if (text.length > 128) text = text.substring(0, 128);

        let chatData = {chat: text}
        connection.send(JSON.stringify(chatData));

        event.target.value = "";
        document.getElementById("chat").style.display = "none";
        pressedKeys = {};
        chatting = false;

    }

}

function newEntity() {

    let data = {spawn: document.getElementById("spawn").value,
                script: document.getElementById("script").value};
    connection.send(JSON.stringify(data));

    localStorage.setItem("lastSpawn", data.spawn);
    localStorage.setItem("lastScript", data.script);

    let duplicate = false;
    for (let recent of recentScripts) {
        if (recent.spawn === data.spawn && recent.script === data.script) {
            duplicate = true;
            break;
        }
    }
    if (!duplicate) recentScripts.push(data);
    localStorage.setItem("recentScripts", JSON.stringify(recentScripts));


    document.getElementById("newentity").style.display = "none";
    pressedKeys = {};
    scripting = false;

}

function receiveMessage(event) {

    //console.log("*** Procesing incoming message... ***");

    let data = JSON.parse(event.data);

    if (data.hasOwnProperty("you")) {

        myId = data.you;
        console.log("Connected and given id of " + myId);

        let newAvatar = {image: selectedAvatar.id,
                         name: document.getElementById("avatarName").value};

        connection.send(JSON.stringify(newAvatar));

    }

    if (data.hasOwnProperty("id")) {

        if (entities[data.id] === undefined) entities[data.id] = {};

        if (data.hasOwnProperty("x")) entities[data.id].targetX = data.x;
        if (data.hasOwnProperty("y")) entities[data.id].targetY = data.y;
        if (data.hasOwnProperty("t")) entities[data.id].targetT = data.t;
        if (data.hasOwnProperty("solid")) entities[data.id].solid = data.solid;

        if (data.hasOwnProperty("chat")) entities[data.id].chat = data.chat;
        if (data.hasOwnProperty("chattime")) entities[data.id].chattime = data.chattime;
        if (data.hasOwnProperty("error")) entities[data.id].error = data.error;

        if (data.hasOwnProperty("image")) {
            if (entities[data.id].image === undefined && data.id === myId) {
                cameraX = (entities[myId].currentX-w/128);
                cameraY = (entities[myId].currentY-h/96);
                if (isNaN(cameraX) || isNaN(cameraY)) {
                  cameraX = 64-w/128;
                  cameraY = 64-h/96;
                }
            }
            entities[data.id].image = document.getElementById(data.image);
        }

        if (data.hasOwnProperty("name")) entities[data.id].name = data.name;

        console.log(event.data);

    }

    if (data.hasOwnProperty("stack")) {

        let x, y
        if (data.hasOwnProperty("x")) x = data.x;
        if (data.hasOwnProperty("y")) y = data.y;

        if (x !== undefined && y !== undefined) {
            tileMap[x][y] = data.stack;
        }

    }

    if (data.hasOwnProperty("serverTime")) {

        lastServerTime = data.serverTime;
        lastUpdateTime = clientTime;

    }

    if (data.hasOwnProperty("delete")) {

        delete entities[data.delete];

    }

}
