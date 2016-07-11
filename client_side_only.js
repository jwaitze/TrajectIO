function networkMain(socket) {};
function gameMain() {
    updateFactors();
    manageSpawns();
    manageCollisions();
    manageBlackHoleBots();
    manageDeadAndDeleted();
    manageMovement();
    manageSizes();
    drawBackground();
    drawGrid();
    drawCircles();
};

function getDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

function getDirection(sourceX, sourceY, targetX, targetY) {
    return (180 * Math.atan2(targetY - sourceY, targetX - sourceX) / Math.PI + 360) % 360;
}

function getNewDirection(sumX, sumY) {
    return (180 * Math.atan2(sumY, sumX) / Math.PI + 360) % 360;
}

function getVectorX(magnitude, direction) {
    return magnitude * Math.cos(direction * Math.PI / 180);
}

function getVectorY(magnitude, direction) {
    return magnitude * Math.sin(direction * Math.PI / 180);
}

function getNewVelocity(sumX, sumY) {
    return Math.sqrt(Math.pow(sumX, 2) + Math.pow(sumY, 2))
}

// function getCollisionTime(targetX, targetY, sourceX, sourceY, targetVelocity, sourceVelocity, targetDirection, positiveVersion) {
//     if(-1*Math.pow(targetVelocity, 2)*Math.pow(Math.sin(targetDirection), 2) - Math.pow(targetVelocity, 2)*Math.pow(Math.cos(targetDirection), 2) + sourceVelocity == 0)
//         return Infinity;

//     var positiveFactor = -1;
//     if(positiveVersion)
//         positiveFactor = 1;

//     return (positiveFactor*0.5*Math.sqrt(Math.pow(2*sourceX*targetVelocity*Math.cos(targetDirection) - 2*targetX*targetVelocity*Math.cos(targetDirection) + 2*targetVelocity*sourceY*Math.sin(targetDirection) - 2*targetVelocity*targetY*Math.sin(targetDirection), 2) - 4*(Math.pow(sourceX, 2) - 2*sourceX*targetX + Math.pow(targetX, 2) + Math.pow(sourceY, 2) - 2*sourceY*targetY + Math.pow(targetY, 2))*(Math.pow(targetVelocity, 2)*Math.pow(Math.sin(targetDirection), 2) + Math.pow(targetVelocity, 2)*Math.pow(Math.cos(targetDirection), 2) - sourceVelocity)) + sourceX*targetVelocity*Math.cos(targetDirection) - targetX*targetVelocity*Math.cos(targetDirection) + targetVelocity*sourceY*Math.sin(targetDirection) - targetVelocity*targetY*Math.sin(targetDirection))/(-1*Math.pow(targetVelocity, 2)*Math.pow(Math.sin(targetDirection), 2) - Math.pow(targetVelocity, 2)*Math.pow(Math.cos(targetDirection), 2) + sourceVelocity);
// }

// function getCollisionCoordinates(target, source) {
//     var targetX = circles[target].x,
//         targetY = circles[target].y,
//         sourceX = circles[source].x,
//         sourceY = circles[source].y,
//         targetVelocity = circles[target].velocity,
//         sourceVelocity = 6,
//         targetDirection = circles[target].direction;

//     var timeA = getCollisionTime(targetX, targetY, sourceX, sourceY, targetVelocity, sourceVelocity, targetDirection, true),
//         timeB = getCollisionTime(targetX, targetY, sourceX, sourceY, targetVelocity, sourceVelocity, targetDirection, false);

//     console.log(targetVelocity + " " + targetDirection + " " + timeA + " " + timeB);

//     var collisionX = targetX + getVectorX(targetVelocity*timeB, targetDirection),
//         collisionY = targetY + getVectorX(targetVelocity*timeB, targetDirection);

//     if(Math.sqrt(Math.pow(collisionX - sourceX, 2) + Math.pow(collisionY - sourceY, 2)) != sourceVelocity*timeB) {
//         collisionX = targetX + getVectorX(targetVelocity*timeA, targetDirection);
//         collisionY = targetY + getVectorX(targetVelocity*timeA, targetDirection);
//     }

//     return {x:collisionX, y:collisionY};
// }

function updateFactors() {
    var smallerAxis = screenHeight,
        largerAxis = screenWidth;
    if(screenHeight > screenWidth) {
        smallerAxis = screenWidth;
        largerAxis = screenHeight;
    }
    sizeFactor = 0.0010214504596527069 * smallerAxis;
    countFactor = 0.0005208333333333333 * largerAxis;
}

function addCircle(x, y, velocity, direction, mass, iC, oC, type, id) {
    innerColor = getRandomColor();
    outerColor = getRandomColor();
    switch (type) {
        case "exploder":
            innerColor = "#FFB300";
            outerColor = "#FF8300";
            break;
        case "blackholebot":
            innerColor = "black";
            break;
        case "player":
            innerColor = "#00DFF0";
            outerColor = "#14C8E5";
            break;
        case "food":
            innerColor = "white";
            break;
        case "floater":
            innerColor = "green";
            break;
    }
    if(iC != null)
        innerColor = iC;
    if(oC != null)
        outerColor = oC;
    var utc = (new Date).getTime();
    circles.push({
        x: x,
        y: y,
        velocity: velocity,
        direction: direction,
        mass: mass,
        innerColor: innerColor,
        outerColor: outerColor,
        type: type,
        id: null == id ? utc + "|" + Math.random() : id,
        delete: !1,
        bot: {
            nextShotTime: 0,
            shotsToFire: 0,
            delayBetweenShots: 0,
            shootX: 0,
            shootY: 0
        },
        creationTime: utc
    });
}

function updateTypeCounts() {
    for (var i = blackholebotCount = floaterCount = exploderCount = foodCount = 0; i < circles.length; i++)
        switch (circles[i].type) {
        case "food":
            foodCount++;
            break;
        case "exploder":
            exploderCount++;
            break;
        case "floater":
            floaterCount++;
            break;
        case "blackholebot":
            blackholebotCount++;
            break;
    }
}

function manageDeadAndDeleted() {
    for (var i = 0; i < circles.length; i++) {
        if(sizeFactor > circles[i].mass || circles[i].delete)
            circles.splice(i, 1);
    }
}

function manageSizes() {
    for (var i = 0; i < circles.length; i++)
        if ("exploder" == circles[i].type && circles[i].mass >= (sizeFactor*400) / 3 + (sizeFactor*2))
            circles[i].mass = (sizeFactor*400) / 3 - (sizeFactor*5);
        else {
            var o = .0164 * Math.pow(1.0095, circles[i].mass) - sizeFactor*.014;
            if(circles[i].mass > sizeFactor*250)
                circles[i].mass = sizeFactor*250;
            else if(circles[i].mass > sizeFactor*200)
                circles[i].mass -= .5 * o;
            else if(circles[i].mass > sizeFactor*150)
                circles[i].mass -= .25 * o;
            else if(circles[i].mass > sizeFactor*100)
                circles[i].mass -= .125 * o;
            if(circles[i].mass < 0)
                circles[i].mass = Math.abs(circles[i].mass);
        }
}

function pickBlackHoleTarget() {
    var exploderIndex = Math.floor(Math.random() * exploderCount);
    for(var i = 0; i < circles.length; i++) {
        if(circles[i].type == "exploder") {
            if(exploderIndex == 0)
                return i;

            exploderIndex--;
        }
    }
}

function manageBlackHoleBots() {
    for (var i = 0; i < circles.length; i++) {
        if ("blackholebot" == circles[i].type) {
            circles[i].mass = 50;
            var utc = (new Date).getTime();
            if(circles[i].bot.nextShotTime < utc) {
                if(circles[i].bot.shotsToFire == 0 || circles[i].bot.nextShotTime == 0) {
                    circles[i].bot.nextShotTime = utc + 1E3 * (2 * Math.random() + 2);
                    circles[i].bot.shotsToFire = Math.floor(3 * Math.random() + 1);
                    circles[i].bot.delayBetweenShots = 1E3 * (1.25 * Math.random() + .25);
                } else {
                    //var collision = getCollisionCoordinates(0, 1);
                    var target = pickBlackHoleTarget();
                    ejectCircle(6, i, circles[target].x, circles[target].y);
                    circles[i].bot.shotsToFire--;
                    circles[i].bot.nextShotTime += circles[i].bot.delayBetweenShots;
                }
            }
        }
    }
}

function manageMovement() {
    for (var i = circles.length - 1; 0 <= i; i--) {
        if(circles[i].velocity) {
            circles[i].x += getVectorX(sizeFactor*circles[i].velocity, circles[i].direction);
            circles[i].y += getVectorY(sizeFactor*circles[i].velocity, circles[i].direction);
        }
        
        if(circles[i].x >= screenWidth - sizeFactor*circles[i].mass) {
            circles[i].direction = 180 - circles[i].direction;
            circles[i].x = screenWidth - sizeFactor*circles[i].mass;
        }
        else if(circles[i].x <= sizeFactor*circles[i].mass) {
            circles[i].direction = 180 - circles[i].direction;
            circles[i].x = sizeFactor*circles[i].mass;
        } else if(circles[i].y >= screenHeight - sizeFactor*circles[i].mass) {
            circles[i].direction = 360 - circles[i].direction;
            circles[i].y = screenHeight - sizeFactor*circles[i].mass;
        } else if(circles[i].y <= sizeFactor*circles[i].mass) {
            circles[i].direction = 360 - circles[i].direction;
            circles[i].y = sizeFactor*circles[i].mass;
        }
    }
}

function manageSpawns() {
    updateTypeCounts();
    var velocity = 0;
    for (var i = 0; i < Math.floor(countFactor*30) - floaterCount; i++) {
        velocity = 0;
        if(Math.ceil(10 * Math.random()) >= 7)
            velocity = Math.random() * 4 + 1;
        addCircle(Math.random() * screenWidth, Math.random() * screenHeight, velocity, Math.random()*360, Math.random()*25 + 5, null, null, "floater", null);
    }

    for (var i = 0; i < Math.floor(countFactor*300) - foodCount; i++) {
        velocity = 0;
        if(Math.ceil(Math.random() * 10) >= 3)
            velocity = Math.random() * 1;
        addCircle(Math.random() * screenWidth, Math.random() * screenHeight, velocity, Math.random()*360, Math.random()*2 + 3, null, null, "food", null);
    }

    for (var i = 0; i < Math.floor(countFactor*8) - exploderCount; i++) {
        velocity = 0;
        if(Math.ceil(Math.random() * 10) >= 7)
            velocity = Math.random() * 3 + 1;
        addCircle(Math.random() * screenWidth, Math.random() * screenHeight, velocity, Math.random()*360, Math.random()*10 + 30, null, null, "exploder", null);
    }

    for (var i = 0; i < 2 - blackholebotCount; i++)
        addCircle(Math.random() * screenWidth, Math.random() * screenHeight, 0, 0, 0, null, null, "blackholebot", null);
}

function explodeCircle(c) {
    var particles = Math.floor(Math.random() * 5 + 5),
        type = "exploded";
    if(circles[c].type == "exploder") {
        particles = 3;
        if(sizeFactor*circles[c].mass * 3 < sizeFactor*100)
            particles = 4;
        type = circles[c].type;
        circles[c].delete = true;
    }
    var angle = Math.floor(Math.random() * 360);
    for (var i = 0; i < particles; i++) {
        var x = circles[c].x + getVectorX((sizeFactor*circles[c].mass) / 2, angle),
            y = circles[c].y + getVectorY((sizeFactor*circles[c].mass) / 2, angle);
        addCircle(x, y, Math.random() * 4 + 1, angle, circles[c].mass / particles, circles[c].innerColor, circles[c].outerColor, type, null);
        angle = (angle + 360 / particles) % 360;
    }
    circles[c].mass /= 3;
}

function manageCollisions() {
    for (var a = 0; a < circles.length; a++) {
        for (var b = a + 1; b < circles.length; b++) {
            if (circles[a] && circles[b] && !circles[a].delete && !circles[b].delete && circles[a].mass != circles[b].mass) {
                var l = a, s = b;
                if(circles[a].mass < circles[b].mass) 
                    l = b, s = a;
                var distance = getDistance(circles[l].x, circles[l].y, circles[s].x, circles[s].y);
                if (!(circles[s].type == "blackholebot" || circles[l].type == "blackholebot"
                    && circles[s].type == "exploder" || circles[l].id == circles[s].id
                    && distance + 1E-4 <= Math.floor(sizeFactor*(circles[l].mass + circles[s].mass)))
                    && distance + 1E-4 <= Math.floor(sizeFactor*circles[l].mass) && circles[l].id != circles[s].id) {
                    if (!("ejected" != circles[s].type && 100 > (new Date).getTime() - circles[s].creationTime)) {
                        if ("exploder" == circles[s].type)
                            explodeCircle(l);
                        else {
                            if(circles[s].velocity == 0) {
                                circles[l].velocity = (circles[l].mass * circles[l].velocity + circles[s].mass * circles[s].velocity) / (circles[l].mass + circles[s].mass);
                                circles[l].mass += circles[s].mass / 5;
                            } else {
                                var vectorLargeX = getVectorX(circles[l].velocity * circles[l].mass, circles[l].direction);
                                var vectorLargeY = getVectorY(circles[l].velocity * circles[l].mass, circles[l].direction);
                                var vectorSmallX = getVectorX(circles[s].velocity * circles[s].mass, circles[s].direction);
                                var vectorSmallY = getVectorY(circles[s].velocity * circles[s].mass, circles[s].direction);
                                circles[l].mass += circles[s].mass / 5;
                                circles[l].velocity = getNewVelocity(vectorLargeX + vectorSmallX, vectorLargeY + vectorSmallY) / circles[l].mass;
                                circles[l].direction = getNewDirection(vectorLargeX + vectorSmallX, vectorLargeY + vectorSmallY);
                            }
                            if(circles[s].type == "player") {
                                console.log(s + "(mass:" + 3 * Math.floor(circles[s].mass) + ") absorbed by " + l + "(mass:" + 3 * Math.floor(circles[l].mass) + ") after " + ((new Date).getTime() - circles[s].creationTime) / 1E3 + " secs");
                                if(s == 0)
                                    gameOver = true;
                            }
                       }
                    }
                    circles[s].delete = true;
                }
            }
        }
    }
}

function ejectCircle(velocity, i, targetX, targetY) {
    var targetDirection = getDirection(circles[i].x, circles[i].y, targetX, targetY);
    circles[i].mass -= circles[i].mass / 50;
    ejectMass = circles[i].mass / 5;
    var startX = circles[i].x + getVectorX(sizeFactor*circles[i].mass, targetDirection),
        startY = circles[i].y + getVectorY(sizeFactor*circles[i].mass, targetDirection),
        oppositeDirection = (targetDirection + 180) % 360,
        newEjectX = getVectorX(velocity * ejectMass, oppositeDirection),
        newEjectY = getVectorY(velocity * ejectMass, oppositeDirection),
        newSourceX = getVectorX(circles[i].velocity * circles[i].mass, circles[i].direction),
        newSourceY = getVectorY(circles[i].velocity * circles[i].mass, circles[i].direction);
    circles[i].velocity = getNewVelocity(newEjectX + newSourceX, newEjectY + newSourceY) / circles[i].mass;
    circles[i].direction = getNewDirection(newEjectX + newSourceX, newEjectY + newSourceY);
    newEjectX = getVectorX(velocity, targetDirection);
    newEjectY = getVectorY(velocity, targetDirection);
    newSourceX = getVectorX(circles[i].velocity, circles[i].direction);
    newSourceY = getVectorY(circles[i].velocity, circles[i].direction);
    velocity = getNewVelocity(newEjectX + newSourceX, newEjectY + newSourceY) - circles[i].velocity + 2 * velocity;
    addCircle(startX, startY, velocity, targetDirection, ejectMass, circles[i].innerColor, circles[i].outerColor, "ejected", circles[i].id)
}

function getRandomColor() {
    var c = "#";
    for (var i = 0; i < 6; i++)
        c += "0123456789ABCDEF"[Math.floor(16 * Math.random())];
    return c;
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

function getSortedCircles() {
    var s = circles.slice();
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

function drawCircles() {
    var sc = getSortedCircles();
    for (var i = circles.length - 1; 0 <= i; i--) {

        var transparency = .9;
        if(sc[i].type == "blackholebot")
            transparency = .7;

        var shadow = 0;
        if(sc[i].id == circles[0].id)
            shadow = 10;

        var sides = 25;
        if(sc[i].type == "exploder")
            sides = Math.floor(Math.random() * 15 + 12);

        drawCircle(sc[i].x || screenWidth / 2, sc[i].y || screenHeight / 2, sizeFactor * sc[i].mass, sides, sc[i].innerColor, sc[i].outerColor, transparency, shadow);
        if(sc[i].mass > 16) {
            var playerHasName = playerName.length > 0 && sc[i].type == "player";
            var y = sc[i].y + 5;
            if(playerHasName)
                y += 15;

            drawValue(Math.floor(sc[i].mass) * 3, sc[i].x, y);
            if(playerHasName)
                drawValue(playerName, sc[i].x, y - 20);
        }
    }
}

function drawCircle(x, y, radius, sides, innerColor, outerColor, transparency, shadow) {
    var a = 0, b = 0;
    canvas.beginPath();

    //var distanceFromMiddle = getDistance(screenWidth/2, screenHeight/2, x, y);
    //var directionFromMiddle = getDirection(screenWidth/2, screenHeight/2, x, y);
    //var middleX = getVectorX(distanceFromMiddle, directionFromMiddle);
    //var middleY = getVectorY(distanceFromMiddle, directionFromMiddle);
    //var newX = (Math.abs(middleX)/(screenWidth/2)) * (x + getVectorX(radius, directionFromMiddle)),
    //  newY = (Math.abs(middleY)/(screenWidth/2)) * (y + getVectorY(radius, directionFromMiddle));
    //if(innerColor == "#00DFF0")
    //  console.log();
    //var gradient=canvas.createRadialGradient(newX,newY,radius*.4,newX,newY,radius*.9);
    //gradient.addColorStop(0,"white");
    //gradient.addColorStop(1,innerColor);

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
    canvas.fillStyle = "#2ecc71";
    canvas.strokeStyle = "#27ae60";
    if(screenWidth < 480)
        canvas.font = "bold 14px Verdana";
    else
        canvas.font = "bold 16px Verdana";
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
    gameTime = (new Date).getTime();
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, "");
    document.getElementById("gameAreaWrapper").style.display = "block";
    document.getElementById("startMenuWrapper").style.display = "none";
    socket = io({});
    networkMain(socket);
    circles = [];
    addCircle(screenWidth / 2, screenHeight / 2, 0, 0, 50, null, null, "player", null);
    animloop();
}

function animloop() {
    if(gameOver) {
        document.getElementById("gameAreaWrapper").style.display = "none";
        document.getElementById("startMenuWrapper").style.display = "inline";
        document.querySelector("#startMenu .gameover").style.display = "inline";
        cancelAnimationFrame(animloopHandle);
        animloopHandle = undefined;
        return;
    }
    animloopHandle = requestAnimFrame(animloop);
    appMain();
}

function appMain() {
    gameMain();
}

function mouseClick(e) {
    ejectCircle(4, 0, e.clientX, e.clientY);
}

function keys(e) {
    switch (e.keyCode || e.which) {
        case 32: // [SPACEBAR]
            ejectCircle(12, 0, mousePosition.x, mousePosition.y);
            break;
        case 13: // [ENTER]
            if(gameOver)
                startGame();
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
}

function makeMeBlackHole() {
    for (var i = 0; i < circles.length; i++)
        if ("blackholebot" == circles[i].type) {
            var t = circles[i];
            circles[i] = circles[0];
            circles[0] = t;
            break;
        }
};

var mousePosition = {},
    circles = [];

var foodCount = 0,
    exploderCount = 0,
    floaterCount = 0,
    blackholebotCount = 0;

var playerName, playerNameInput = document.getElementById("playerNameInput"),
    socket,
    disconnected,
    gameOver = true,
    gameTime = 0,
    animloopHandle,
    screenWidth = window.innerWidth,
    screenHeight = window.innerHeight,
    c = document.getElementById("cvs"),
    canvas = c.getContext("2d"),
    sizeFactor = 0,
    countFactor = 0;

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