function sendServerTest() {
    if(!isEmpty(socket))
        socket.emit('test');
}

function sendServerDisconnect() {
    if(!isEmpty(socket))
        socket.emit('disconnect');
}

function sendServerResize(x, y) {
    if(!isEmpty(socket))
        socket.emit('q', {type: "resize", screenWidth: x, screenHeight: y});
}

function sendServerEject(direction) {
    if(!isEmpty(socket))
        socket.emit('q', {type: "eject", direction: direction});
}

function networkMain() {
    socket = io();

    socket.on('0', function(data) {
        socket.emit('0', {
            nickname: playerName,
            screenWidth: screenWidth,
            screenHeight: screenHeight
        });
    });

    socket.on('1', function() {
        socket.emit('1');
    });

    socket.on('2', function() {
        gameObjects = [];
        gameTime = (new Date).getTime();
        document.getElementById("gameAreaWrapper").style.display = "block";
        document.getElementById("loadingWrapper").style.display = "none";
        animloop();
    });

    socket.on('q', function(data) {
        handleServerData(socket, data);
    });

    socket.on('disconnect', function () {
        console.log("disconnected");
        socket.close();
        gameOver = true;
    });
};

function handleServerData(socket, data) {
    switch(data.type) {
        case "die":
        gameOver = true;
        break;
        case "update":
        myIndex = data.gameObjectIndex;
        gameObjects = data.gameObjects;
        console.log(gameObjects.length);
        break;
        default:
        break;
    }
}

function drawBackground() {
    canvas.fillStyle = "#555555";
    canvas.fillRect(0, 0, screenWidth, screenHeight);
}

function drawGrid() {
    canvas.lineWidth = 1;
    canvas.strokeStyle = "#F6F6F6";
    canvas.globalAlpha = .15;
    canvas.beginPath();
    for (var i = 0; i < screenWidth; i += screenHeight / 18) 
        canvas.moveTo(i, 0), canvas.lineTo(i, screenHeight);
    for (var i = 0; i < screenHeight; i += screenHeight / 18) 
        canvas.moveTo(0, i), canvas.lineTo(screenWidth, i);
    canvas.stroke();
    canvas.globalAlpha = 1;
}

function getSortedGameObjects() {
    var s = gameObjects.slice();
    s.sort(function(a, b) {
        var isATypeBlackHoleBot = a.type == "blackholebot";
        var isBTypeBlackHoleBot = b.type == "blackholebot";
        if(isATypeBlackHoleBot && !isBTypeBlackHoleBot)
            return -1;
        else if(!isATypeBlackHoleBot && isBTypeBlackHoleBot)
            return 1;
        else if(isATypeBlackHoleBot && isBTypeBlackHoleBot) {
            if(a.velocity > b.velocity)
                return -1;
            else if(a.velocity < b.velocity)
                return 1;
            else
                return 0;
        }

        if(a.mass > b.mass)
            return -1;
        else if(a.mass < b.mass)
            return 1;
        else {
            if(a.velocity > b.velocity)
                return -1;
            else if(a.velocity < b.velocity)
                return 1;
            else
                return 0;
        }
    });
    return s;
}

function drawGameObjects() {
    var sgo = getSortedGameObjects();
    for (var i = gameObjects.length - 1; 0 <= i; i--) {
        if(isEmpty(gameObjects[i]))
            continue;

        var transparency = .9;
        if(sgo[i].type == "blackholebot")
            transparency = .7;

        var shadow = 0;
        if(sgo[i].id == gameObjects[myIndex].id)
            shadow = 10;

        var sides = 25;
        if(sgo[i].type == "exploder")
            sides = Math.floor(Math.random() * 15 + 12);

        drawGameObject(sgo[i].x, sgo[i].y, sgo[i].mass, sides, sgo[i].innerColor, sgo[i].outerColor, transparency, shadow);
        if(sgo[i].type == "player") {
            if(sgo[i].id != gameObjects[myIndex].id && sgo[i].nickname != undefined && sgo[i].nickname.length > 0)
                drawValue(sgo[i].nickname, sgo[i].x, sgo[i].y + 5);

            if(sgo[i].id == gameObjects[myIndex].id) {
                var playerHasName = playerName.length > 0;
                var y = sgo[i].y + 5;
                if(playerHasName)
                    y += 15;

                drawValue(Math.floor(sgo[i].mass) * 3, sgo[i].x, y);
                if(playerHasName)
                    drawValue(playerName, sgo[i].x, y - 20);
            }
        }
    }
}

function drawGameObject(x, y, radius, sides, innerColor, outerColor, transparency, shadow) {
    var a = 0, b = 0;
    canvas.beginPath();

    canvas.fillStyle = innerColor;
    canvas.lineWidth = 5;
    canvas.strokeStyle = outerColor;
    canvas.globalAlpha = transparency != null ? transparency : 1;
    canvas.shadowColor = "#ccc";
    canvas.shadowBlur = shadow != null ? shadow : 0;
    for (var i = 0; i < sides; i++) {
        a = i / sides * 2 * Math.PI;
        b = x + radius * Math.sin(a);
        a = y + radius * Math.cos(a);
        canvas.lineTo(b, a);
    }
    canvas.closePath();
    canvas.stroke();
    canvas.fill();
}

function drawValue(v, x, y) {
    canvas.shadowBlur = 0;
    canvas.transparency = 1;
    canvas.fillStyle = "#9E7BB8";
    canvas.strokeStyle = "#472976";
    if(screenWidth < 480)
        canvas.font = "14px Verdana";
    else
        canvas.font = "16px Verdana";
    canvas.textAlign = "center";
    canvas.lineWidth = 2;
    canvas.fillText(v, x, y);
    canvas.strokeText(v, x, y);
}

window.requestAnimFrame = function() {
    return window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || function(e) {
        window.setTimeout(e, 1E3 / 60);
    }
}();

function startGame() {
    gameOver = false;
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, "");
    if(playerName == undefined || playerName.length < 1)
        playerName = "An Unnamed Cell";
    document.getElementById("loadingWrapper").style.display = "block";
    document.getElementById("startMenuWrapper").style.display = "none";
    networkMain();
}

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
            return false;
    }
    return true;
}

function drawGame() {
    drawBackground();
    drawGrid();
    drawGameObjects();
}

function animloop() {
    if(gameOver) {
        document.getElementById("gameAreaWrapper").style.display = "none";
        document.getElementById("startMenuWrapper").style.display = "inline";
        document.querySelector("#startMenu .gameover").style.display = "inline";
        socket.close();
        socket = undefined;
        cancelAnimationFrame(animloopHandle);
        animloopHandle = undefined;
        return;
    } else {
        animloopHandle = requestAnimFrame(animloop);
        drawGame();
    }
}

function getDirection(sourceX, sourceY, targetX, targetY) {
    return (180 * Math.atan2(targetY - sourceY, targetX - sourceX) / Math.PI + 360) % 360
}

function doEject(mouse) {
    if(!gameOver && !isEmpty(gameObjects[myIndex])) {
        var direction = getDirection(gameObjects[myIndex].x, gameObjects[myIndex].y, mouse.clientX, mouse.clientY);
        sendServerEject(direction);
    }
}

function mouseClick(e) {
    doEject(e);
}

function keys(e) {
    switch (e.keyCode || e.which) {
        case 32: // [SPACEBAR]
        doEject(mousePosition);
        break;
        case 13: // [ENTER]
        if(gameOver)
            startGame();
        break;
        case 84: // t for tes
        sendServerTest();
        break;
        case 27: // [ESC]
        sendServerDisconnect();
        break;
    }
}

function mouseMove(e) {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
}

function handleFocus(e) {
    switch(e.type) {
        case "mouseover":
            c.focus();
            break;
        case "mouseout":
            c.blur();
            break;
    }
}

function resizeWindow(e) {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    c.width = screenWidth;
    c.height = screenHeight;
    sendServerResize(screenWidth, screenHeight);
}

var mousePosition = {},
    gameObjects = [];

var playerName, playerNameInput = document.getElementById("playerNameInput"),
    socket,
    disgoonnected,
    gameOver = true,
    gameTime = 0,
    animloopHandle,
    screenWidth = window.innerWidth,
    screenHeight = window.innerHeight,
    c = document.getElementById("cvs"),
    canvas = c.getContext("2d"),
    myIndex;

c.width = screenWidth;
c.height = screenHeight;

c.addEventListener("mousemove", mouseMove, false);
c.addEventListener("mouseover", handleFocus, false);
c.addEventListener("mouseout", handleFocus, false);
c.addEventListener("click", mouseClick, false);
c.addEventListener("keydown", keys, false);
playerNameInput.addEventListener("keypress", keys, false);
window.addEventListener("resize", resizeWindow, false);

window.onload = function() {
    document.getElementById("startButton").onclick = function() {
        startGame();
    };
};