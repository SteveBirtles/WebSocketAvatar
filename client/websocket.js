let connection;

function chat(event) {

    if (event.key == "Enter" && event.target.value != "") {

        let text = event.target.value;
        if (text.length > 128) text = text.substring(0, 128);

        let chatData = {chat: text, chattime: worldTime + chatLifespan}
        connection.send(JSON.stringify(chatData));

        event.target.value = "";
        document.getElementById("chat").style.display = "none";
        pressedKeys = {};
        chatting = false;

    }

}

function receiveMessage(event) {

    //console.log("*** Procesing incoming message... ***");

    let data = JSON.parse(event.data);

    if (data.hasOwnProperty("you")) {

        myId = data.you;
        console.log("Connected and given id of " + myId);

        let newAvatar = {x: Math.floor(Math.random() * MAP_SIZE) + 1,
                         y: Math.floor(Math.random() * MAP_SIZE) + 1,
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

        delete avatars[data.delete];

    }

}
