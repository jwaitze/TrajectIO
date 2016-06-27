var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var config = require('./config.json');

app.use(express.static(__dirname + '/../client'));

var users = [];
var gameObjects = [];
var arenaWidth,
	arenaHeight;

var foodCount = 0,
    exploderCount = 0,
    floaterCount = 0,
    blackholebotCount = 0;

var logObjectsCounts = false;

function doLogObjectsCounts() {
    if(logObjectsCounts) {
        if(!isEmpty(users) && !isEmpty(gameObjects))
            console.log("Players: " + users.length + " | Game Objects: " + gameObjects.length);
        else
            console.log("Players: 0 | Game Objects: 0");
        logObjectsCounts = false;
    }
}

function updateFactors() {
	spawnFactor = 1;//users.length != 0 ? users.length : 1;
	arenaWidth = arenaHeight = Math.sqrt(spawnFactor * Math.pow(900, 2));
}

function findUserIndexFromGameObject(g) {
    if(isEmpty(gameObjects[g]))
        return;

    for (var i = 0; i < users.length; i++) {
        if (!isEmpty(users[i]) && gameObjects[g].userid == users[i].id)
            return i;
    }
}

function findUserIndex(socket) {
	if(isEmpty(socket))
		return;

    for (var i = 0; i < users.length; i++) {
        if (!isEmpty(users[i]) && users[i].id == socket.id)
            return i;
    }
}

function findGameObjectFromUserIndex(u) {
	if(isEmpty(users[u]))
		return;
    for (var i = 0; i < gameObjects.length; i++) {
        if (!isEmpty(gameObjects[i]) && gameObjects[i].userid == users[u].id)
            return i;
    }
}

function networkSetupMain() {
	io.on('connection', function(socket) {
	    socket.emit('0');
	    socket.on('0', function(data) {
	        users.push({
	            nickname: data.nickname,
	            screenWidth: data.screenWidth,
	            screenHeight: data.screenHeight,
	            id: socket.id,
	            latency: (new Date).getTime(),
	            waitingForPong: true,
	            ip: socket.request.connection.remoteAddress,
	            delete: false,
	            ready: false,
	            socket: socket
	        });
	        socket.emit('1', socket.id);
	    });

	    socket.on('1', function() {
	        var u = findUserIndex(socket);
	        if (!isEmpty(users[u]) && users[u].waitingForPong) {
	            users[u].latency = (new Date).getTime() - users[u].latency;
	            users[u].waitingForPong = false;
	            addGameObject(Math.random()*arenaWidth, Math.random()*arenaHeight, 0, 0, 50, null, null, "player", null, users[u].id, users[u].nickname);
                logObjectsCounts = true;
	            console.log("[" + u + "] Connection: " + users[u].ip + " | " + users[u].nickname + " | " + users[u].latency + "ms | " + users[u].screenWidth + "x" + users[u].screenHeight);
	            socket.emit('2');
	            users[u].ready = true;
	        }
	    });

	    socket.on('q', function(data) {
	    	handleClientData(socket, data);
	    });

	    socket.on('disconnect', function() {
	    	var u = findUserIndex(socket);
			var i = findGameObjectFromUserIndex(u);
			socket.disconnect();
            logObjectsCounts = true;
			if(!isEmpty(users[u])) {
                console.log("[" + u + "] Disconnection: " + users[u].ip + " | " + users[u].nickname + " | " + users[u].latency + "ms");
				users[u].delete = true;
            }
			if(!isEmpty(gameObjects[i])) {
				gameObjects[i].delete = true;
            }
	    });

        socket.on('test', function() {
            gameObjects[0].delete = true;
        });
	});
}

function handleClientData(socket, data) {
	var u = findUserIndex(socket);
	var g = findGameObjectFromUserIndex(u);
	switch(data.type) {
		case "eject":
		if(isEmpty(data) || isEmpty(gameObjects[g]))
			break;
        console.log("[" + u + "] Ejected: " + users[u].ip + " " + users[u].nickname + " | dir: " + data.direction.toFixed(2) + " deg");
		var x = getVectorX(1, data.direction);
		var y = getVectorY(1, data.direction);
		ejectMass(4, g, gameObjects[g].x + x, gameObjects[g].y + y);
		break;
		case "resize":
		if(isEmpty(data) || isEmpty(users[u]))
			break;
		console.log("[" + u + "] Resized: " + users[u].ip + " " + users[u].nickname + " | dim: " + data.screenWidth + "x" + data.screenHeight);
		users[u].screenWidth = data.screenWidth;
		users[u].screenHeight = data.screenHeight;
		break;
		default:
		break;
	}
}

function getDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2))
}

function getDirection(sourceX, sourceY, targetX, targetY) {
    return (180 * Math.atan2(targetY - sourceY, targetX - sourceX) / Math.PI + 360) % 360
}

function getNewDirection(sumX, sumY) {
    return (180 * Math.atan2(sumY, sumX) / Math.PI + 360) % 360
}

function getVectorX(magnitude, direction) {
    return magnitude * Math.cos(direction * Math.PI / 180)
}

function getVectorY(magnitude, direction) {
    return magnitude * Math.sin(direction * Math.PI / 180)
}

function getNewVelocity(sumX, sumY) {
    return Math.sqrt(Math.pow(sumX, 2) + Math.pow(sumY, 2))
}

function getRandomColor() {
    var c = "#";
    for (var i = 0; i < 6; i++)
        c += "0123456789ABCDEF"[Math.floor(16 * Math.random())];
    return c;
}

function addGameObject(x, y, velocity, direction, mass, iC, oC, type, id, userid, nickname) {
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
    var uniqueValue = utc + "|" + Math.random();
    gameObjects.push({
        x: x,
        y: y,
        velocity: velocity,
        direction: direction,
        mass: mass,
        innerColor: innerColor,
        outerColor: outerColor,
        type: type,
        id: null == id ? uniqueValue : id,
        delete: false,
        bot: {
            nextShotTime: 0,
            shotsToFire: 0,
            delayBetweenShots: 0,
            shootX: 0,
            shootY: 0
        },
        creationTime: utc,
        userid: null == userid ? uniqueValue : userid,
        nickname: null == nickname ? 0 : nickname
    });
}

function updateTypeCounts() {
    for (var i = blackholebotCount = floaterCount = exploderCount = foodCount = 0; i < gameObjects.length; i++) {
    	if(isEmpty(gameObjects[i]))
    		continue;

        switch (gameObjects[i].type) {
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
}

function manageDeadAndDeleted() {
    for (var i = 0; i < users.length; i++) {
        if(!isEmpty(users[i]) && users[i].delete) {
            users.splice(i, 1);
            var g = findGameObjectFromUserIndex(i);
            if(!isEmpty(gameObjects[g]))
                gameObjects.splice(g, 1);
        }
    }
    for (var i = 0; i < gameObjects.length; i++) {
        if(!isEmpty(gameObjects[i]) && 1 > gameObjects[i].mass || gameObjects[i].delete)
            gameObjects.splice(i, 1);
    }
}

function manageSizes() {
    for (var i = 0; i < gameObjects.length; i++) {
    	if(isEmpty(gameObjects[i]))
    		continue;

        if ("exploder" == gameObjects[i].type && gameObjects[i].mass >= 400 / 3 + 2)
            gameObjects[i].mass = 400 / 3 - 5;
        else {
            var o = .0164 * Math.pow(1.0095, gameObjects[i].mass) - .014;
            if(gameObjects[i].mass > 250)
                gameObjects[i].mass = 250;
            else if(gameObjects[i].mass > 200)
                gameObjects[i].mass -= .5 * o;
            else if(gameObjects[i].mass > 150)
                gameObjects[i].mass -= .25 * o;
            else if(gameObjects[i].mass > 100)
                gameObjects[i].mass -= .125 * o;
            if(gameObjects[i].mass < 0)
                gameObjects[i].mass = Math.abs(gameObjects[i].mass);
        }
    }
}

function pickBlackHoleTarget() {
    var exploderIndex = Math.floor(Math.random() * exploderCount);
    for(var i = 0; i < gameObjects.length; i++) {
        if(!isEmpty(gameObjects[i]) && gameObjects[i].type == "exploder") {
            if(exploderIndex == 0)
                return i;

            exploderIndex--;
        }
    }
}

function manageBlackHoleBots() {
    for (var i = 0; i < gameObjects.length; i++) {
        if (!isEmpty(gameObjects[i]) && gameObjects[i].type == "blackholebot") {
            gameObjects[i].mass = 50;
            var utc = (new Date).getTime();
            if(gameObjects[i].bot.nextShotTime < utc) {
                if(gameObjects[i].bot.shotsToFire == 0 || gameObjects[i].bot.nextShotTime == 0) {
                    gameObjects[i].bot.nextShotTime = utc + 1E3 * (Math.random() * 3 + 3);
                    gameObjects[i].bot.shotsToFire = Math.floor(3 * Math.random() + 1);
                    gameObjects[i].bot.delayBetweenShots = 1E3 * (1.25 * Math.random() + .25);
                } else {
                    var target = pickBlackHoleTarget();
                    ejectMass(6, i, gameObjects[target].x, gameObjects[target].y);
                    gameObjects[i].bot.shotsToFire--;
                    gameObjects[i].bot.nextShotTime += gameObjects[i].bot.delayBetweenShots;
                }
            }
        }
    }
}

function manageMovement() {
    for (var i = gameObjects.length - 1; 0 <= i; i--) {
    	if(isEmpty(gameObjects[i]))
    		continue;

        if(gameObjects[i].velocity) {
            gameObjects[i].x += getVectorX(gameObjects[i].velocity, gameObjects[i].direction);
            gameObjects[i].y += getVectorY(gameObjects[i].velocity, gameObjects[i].direction);
        }
        
        if(gameObjects[i].x >= arenaWidth - gameObjects[i].mass) {
            gameObjects[i].direction = 180 - gameObjects[i].direction;
            gameObjects[i].x = arenaWidth - gameObjects[i].mass;
        }
        else if(gameObjects[i].x <= gameObjects[i].mass) {
            gameObjects[i].direction = 180 - gameObjects[i].direction;
            gameObjects[i].x = gameObjects[i].mass;
        } else if(gameObjects[i].y >= arenaHeight - gameObjects[i].mass) {
            gameObjects[i].direction = 360 - gameObjects[i].direction;
            gameObjects[i].y = arenaHeight - gameObjects[i].mass;
        } else if(gameObjects[i].y <= gameObjects[i].mass) {
            gameObjects[i].direction = 360 - gameObjects[i].direction;
            gameObjects[i].y = gameObjects[i].mass;
        }
    }
}

function manageSpawns() {
    updateTypeCounts();
    var velocity = 0;
    for (var i = 0; i < spawnFactor*15 - floaterCount; i++) {
        velocity = 0;
        if(Math.ceil(10 * Math.random()) >= 7)
            velocity = Math.random() * 4 + 1;
        addGameObject(Math.random() * arenaWidth, Math.random() * arenaHeight, velocity, Math.random()*360, Math.random()*25 + 5, null, null, "floater", null, null, null);
    }

    for (var i = 0; i < spawnFactor*150 - foodCount; i++) {
        velocity = 0;
        if(Math.ceil(Math.random() * 10) >= 3)
            velocity = Math.random() * 1;
        addGameObject(Math.random() * arenaWidth, Math.random() * arenaHeight, velocity, Math.random()*360, Math.random()*2 + 3, null, null, "food", null, null, null);
    }

    for (var i = 0; i < spawnFactor*4 - exploderCount; i++) {
        velocity = 0;
        if(Math.ceil(Math.random() * 10) >= 7)
            velocity = Math.random() * 3 + 1;
        addGameObject(Math.random() * arenaWidth, Math.random() * arenaHeight, velocity, Math.random()*360, Math.random()*10 + 30, null, null, "exploder", null, null, null);
    }

    for (var i = 0; i < spawnFactor*2 - blackholebotCount; i++)
        addGameObject(Math.random() * arenaWidth, Math.random() * arenaHeight, 0, 0, 0, null, null, "blackholebot", null, null, null);
}

function explodeGameObject(c) {
	if(isEmpty(gameObjects[c]))
		return;

    var particles = Math.floor(Math.random() * 5 + 5),
        type = "exploded";
    if(gameObjects[c].type == "exploder") {
        particles = 3;
        if(gameObjects[c].mass * 3 < 100)
            particles = 4;
        type = gameObjects[c].type == "player" ? "exploded" : gameObjects[c].type;
        gameObjects[c].delete = true;
    }
    var angle = Math.floor(Math.random() * 360);
    for (var i = 0; i < particles; i++) {
        var x = gameObjects[c].x + getVectorX((gameObjects[c].mass) / 2, angle),
            y = gameObjects[c].y + getVectorY((gameObjects[c].mass) / 2, angle);
        addGameObject(x, y, Math.random() * 4 + 1, angle, gameObjects[c].mass / particles, gameObjects[c].innerColor, gameObjects[c].outerColor, type, null, null, null);
        angle = (angle + 360 / particles) % 360;
    }
    gameObjects[c].mass /= 3;
}

function manageCollisions() {
    for (var a = 0; a < gameObjects.length; a++) {
        for (var b = a + 1; b < gameObjects.length; b++) {
            if (!isEmpty(gameObjects[a]) && !isEmpty(gameObjects[b]) && !gameObjects[a].delete && !gameObjects[b].delete && gameObjects[a].mass != gameObjects[b].mass) {
                var l = a, s = b;
                if(gameObjects[a].mass < gameObjects[b].mass) 
                    l = b, s = a;
                var distance = getDistance(gameObjects[l].x, gameObjects[l].y, gameObjects[s].x, gameObjects[s].y);
                if (!(gameObjects[s].type == "blackholebot" || gameObjects[l].type == "blackholebot"
                    && gameObjects[s].type == "exploder" || gameObjects[l].id == gameObjects[s].id
                    && distance + 1E-4 <= Math.floor(gameObjects[l].mass + gameObjects[s].mass))
                    && distance + 1E-4 <= Math.floor(gameObjects[l].mass) && gameObjects[l].id != gameObjects[s].id) {
                    if (!("ejected" != gameObjects[s].type && 100 > (new Date).getTime() - gameObjects[s].creationTime)) {
                        if ("exploder" == gameObjects[s].type)
                            explodeGameObject(l);
                        else {
                            if(gameObjects[s].velocity == 0) {
                                gameObjects[l].velocity = (gameObjects[l].mass * gameObjects[l].velocity + gameObjects[s].mass * gameObjects[s].velocity) / (gameObjects[l].mass + gameObjects[s].mass);
                                gameObjects[l].mass += gameObjects[s].mass / 5;
                            } else {
                                var vectorLargeX = getVectorX(gameObjects[l].velocity * gameObjects[l].mass, gameObjects[l].direction);
                                var vectorLargeY = getVectorY(gameObjects[l].velocity * gameObjects[l].mass, gameObjects[l].direction);
                                var vectorSmallX = getVectorX(gameObjects[s].velocity * gameObjects[s].mass, gameObjects[s].direction);
                                var vectorSmallY = getVectorY(gameObjects[s].velocity * gameObjects[s].mass, gameObjects[s].direction);
                                gameObjects[l].mass += gameObjects[s].mass / 5;
                                gameObjects[l].velocity = getNewVelocity(vectorLargeX + vectorSmallX, vectorLargeY + vectorSmallY) / gameObjects[l].mass;
                                gameObjects[l].direction = getNewDirection(vectorLargeX + vectorSmallX, vectorLargeY + vectorSmallY);
                            }
                            if(gameObjects[s].type == "player") {
                                console.log(s + "(mass:" + 3 * Math.floor(gameObjects[s].mass) + ") absorbed by " + l + "(mass:" + 3 * Math.floor(gameObjects[l].mass) + ") after " + ((new Date).getTime() - gameObjects[s].creationTime) / 1E3 + " secs");
                                var u = findUserIndexFromGameObject(s);
                                if(!isEmpty(users[u]))
                                    users[u].socket.emit('q', {type:"die"});
                            }
                       }
                    }
                    gameObjects[s].delete = true;
                }
            }
        }
    }
}

function ejectMass(velocity, i, targetX, targetY) {
	if(isEmpty(gameObjects[i]))
		return;

    var targetDirection = getDirection(gameObjects[i].x, gameObjects[i].y, targetX, targetY);
    gameObjects[i].mass -= gameObjects[i].mass / 50;
    var shootMass = gameObjects[i].mass / 5;
    var startX = gameObjects[i].x + getVectorX(gameObjects[i].mass, targetDirection),
        startY = gameObjects[i].y + getVectorY(gameObjects[i].mass, targetDirection),
        oppositeDirection = (targetDirection + 180) % 360,
        newEjectX = getVectorX(velocity * shootMass, oppositeDirection),
        newEjectY = getVectorY(velocity * shootMass, oppositeDirection),
        newSourceX = getVectorX(gameObjects[i].velocity * gameObjects[i].mass, gameObjects[i].direction),
        newSourceY = getVectorY(gameObjects[i].velocity * gameObjects[i].mass, gameObjects[i].direction);
    gameObjects[i].velocity = getNewVelocity(newEjectX + newSourceX, newEjectY + newSourceY) / gameObjects[i].mass;
    gameObjects[i].direction = getNewDirection(newEjectX + newSourceX, newEjectY + newSourceY);
    newEjectX = getVectorX(velocity, targetDirection);
    newEjectY = getVectorY(velocity, targetDirection);
    newSourceX = getVectorX(gameObjects[i].velocity, gameObjects[i].direction);
    newSourceY = getVectorY(gameObjects[i].velocity, gameObjects[i].direction);
    velocity = getNewVelocity(newEjectX + newSourceX, newEjectY + newSourceY) - gameObjects[i].velocity + 2 * velocity;
    addGameObject(startX, startY, velocity, targetDirection, shootMass, gameObjects[i].innerColor, gameObjects[i].outerColor, "ejected", gameObjects[i].id, null, null)
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

function manageGameObjects() {
	updateFactors();
	manageSizes();
	manageSpawns();
    manageMovement()
	manageCollisions();
	manageBlackHoleBots();
	manageDeadAndDeleted();
    doLogObjectsCounts();
}

function updateClients() {
	var s = getSortedGameObjects();
    for(var i = 0; i < users.length; i++) {
        if(isEmpty(users[i]))
            continue;
        var g = findGameObjectFromUserIndex(i);
        if(isEmpty(gameObjects[g]))
            continue;
        users[i].socket.emit('q', {type:"update", gameObjectIndex:g, gameObjects:gameObjects});
    }
}

function manageMisc() {}

networkSetupMain();

setInterval(manageGameObjects, 1E3 / 60);
setInterval(updateClients, 1E3 / 40);
setInterval(manageMisc, 1E3);

var serverPort = process.env.PORT || config.port;
http.listen(serverPort, function() {
    console.log("Listening on port: " + serverPort);
});