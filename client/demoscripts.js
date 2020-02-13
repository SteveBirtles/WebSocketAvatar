function addDemoScripts() {

  recentScripts.unshift({spawn: `//SIGN
setImage("item45");
`, script: `let nearby = listNearby(2);
if (nearby.length > 0) {
    say("I am a sign, hello!");
}`});

  recentScripts.unshift({spawn: `//MAGIC RUBIES
setImage("item44");
setGroup("rubys");
if (getGroupFlag("n") === undefined) setGroupFlag("n", 0);
`, script: `let nearby = listNearby(3);
let named = 0;
for (let e of nearby) {
   if (e.name !== undefined) named++;
}
if (named > 0) {
    let n = getGroupFlag("n");
    n++;
    setGroupFlag("n", n);
}
say(getGroupFlag("n"));`});

  recentScripts.unshift({spawn: `//OLD MAN WHO HAS LOST HIS KEYS
setImage("avatar29");
setFlag("path", getPath(75, 75));
setSpeed(3);
`, script: `let nearby = listNearby(2);
if (nearby.length > 0) {
    say("Hello there, have you seen my golden key?");
} else if (moved()) {
   let position = getPosition();
   let path = getFlag("path");
   if (path.length > 0) {
      let next = path.shift();
      move(next.x - position.x, next.y - position.y);
      setFlag("path", path);
   } else {
      setFlag("x", Math.floor(Math.random()*10)+70);
      setFlag("y", Math.floor(Math.random()*10)+70);
      setFlag("path", getPath(getFlag("x"),getFlag("y")));
      switch (Math.floor(Math.random()*5)) {
           case 0:
              say("Damn!");
              break;
           case 1:
              say("Where did I leave it?");
              break;
           case 2:
              say("Oh dear...");
              break;
           case 3:
              say("Sigh, no luck.");
              break;
           case 4:
              say("It's got to be here somewhere!");
              break;
       }
    }
}`});

  recentScripts.unshift({spawn: `//FLOOR RUINER
setImage("avatar4");
`, script: `if (moved()) {
   setStack(0,0,[174]);
   let dx = Math.floor(Math.random()*3)-1;
   let dy = Math.floor(Math.random()*3)-1;
   move(dx, dy);
}`});

  recentScripts.unshift({spawn: `//BOUNCING MINE CARTS
setImage("item34");
setFlag("x", 55);
setFlag("y", 64);
setSpeed(8);
setFlag("path", []);
`, script: `if (moved()) {
   let position = getPosition();
   let path = getFlag("path");
   if (path.length > 0) {
      let next = path.shift();
      move(next.x - position.x, next.y - position.y);
      setFlag("path", path);
   } else {
      if (position.x === 55) {
          say("Ping");
          setFlag("x", 65);
          setFlag("y", 64);
      } else if (position.x === 65) {
          say("Pong");
          setFlag("x", 55);
          setFlag("y", 64);
      } else {
          say("Bonk");
      }
      setFlag("path", getPath(getFlag("x"),getFlag("y")));
   }
}`});

}
