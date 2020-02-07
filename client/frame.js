let fps = 0;
let lastFPStime = 0;

let worldTime;
let clientTime;
let lastClientTime;
let lastUpdateTime;
let lastServerTime;

function startFrame(frameTime) {

    lastClientTime = clientTime;
    clientTime = Math.floor(frameTime);
    worldTime = lastServerTime + clientTime - lastUpdateTime;

    if (frameTime - lastFPStime > 1000) {
      document.title = "WebSocket Powererd Avatars [" + fps + " fps]";
      fps = 0;
      lastFPStime = frameTime;
    } else {
      fps++;
    }

}

function gameFrame(frameTime) {

    startFrame(frameTime);

    processInputs();

    updateAvatars();

    let canvas = document.getElementById("avatarCanvas");
    let context = canvas.getContext("2d");

    context.clearRect(0,0,w,h);

    renderWorld(context);

    if (!(showTiles || chatting || miniMap || modeChooser)) drawCurrentTile(context);

    if (showTiles) drawTiles(context);

    if (showControls && !showTiles && !miniMap && !modeChooser) drawControls(context);

    if (modeChooser) drawModeChooser(context);

    window.requestAnimationFrame(gameFrame);

}
