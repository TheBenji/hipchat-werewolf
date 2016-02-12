var config = require('config');
var EventEmitter = require("events").EventEmitter;
var Player = require('./Player');

var Game = function () {
    var self = this;
    this.gamePhase = 0; //0 = not started; 1 = waiting for player; 2=night,wolfes;3=night,doc;4=night,seer;5=day
    this.startedTimeStamp;
    this.players = [];

    this.eventEmitter = new EventEmitter();
    this.interval = setInterval(function () {
        self.mainLoop();
    }, 500);
};

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Game.prototype.mainLoop = function () {
    if (this.gamePhase == 1 && this.startedTimeStamp + config.durations.one < Date.now()) {
        if (this.players.length < config.minPlayers) {
            this.eventEmitter.emit("roomNotification", "Not enough players. Go back to work!", config.roomId);
            this.cleanUp();
        } else {
            this.gamePhase = 2;
            this.assignPlayers();
            this.night();
        }
    }

    if (this.gamePhase == 2 && this.startedTimeStamp + config.durations.one + config.durations.two < Date.now()) {
        this.cleanUp();
    }
}

Game.prototype.night = function () {
    var self = this;
    this.eventEmitter.emit("roomNotification", "It is night!", config.roomId);
    this.players.forEach(function (player) {
        if (player.role == 2) {
            self.eventEmitter.emit("privateMessage", "Choose person to kill by using his @name", player.id);
        }
    });

}

Game.prototype.handleMessage = function (id, message) {

}

Game.prototype.assignPlayers = function () {
    var assignedWolfs = [];
    var self = this;
    while (assignedWolfs.length != config.rolesCount.wolf) {
        var position = getRandomIntInclusive(0, this.players.length - 1);
        if (!this.players[position].role) {
            this.players[position].role = 2;
            assignedWolfs.push(this.players[position].name);
        }
    }


    this.players.forEach(function (player) {
        if (!player.role) {
            player.role = 1;
        }

        self.eventEmitter.emit("privateMessage", "Your role is " + config.roles[player.role], player.id);

        if (player.role == 2) {
            self.eventEmitter.emit("privateMessage", "Wolfs are " + assignedWolfs, player.id);
            self.eventEmitter.emit("listenToMessages", player.id);

        }
    });


}

Game.prototype.cleanUp = function () {
    this.players = [];
    this.gamePhase = 0;
    this.startedTimeStamp = -1;
}

Game.prototype.startGame = function () {
    console.log('Start game: ' + this.gamePhase);
    if (!this.gamePhase == 0) {
        console.log('Cant start');
        return 'Game already started';
    }
    this.startedTimeStamp = Date.now();
    this.gamePhase = 1;
    return "Game started. Type /join to join!";
    //Do all this fancy stuff you gotta do to start a game
}

Game.prototype.joinPlayer = function (name, id) {
    console.log("name:" + name + " id:" + id);

    if (!this.gamePhase == 1) {
        return name + ', you can\'t join right now';
    }
    if (this.findPlayerById(id) !== null) {
        return 'You already joined ' + name;
    }

    this.players.push(new Player(id, name));
    return name + " joined!";
}

Game.prototype.findPlayerById = function (id) {
    var self = this;
    var player = null;
    self.players.forEach(function (p) {
        if (p.id === id) {
            player = p;
        }
    });
    console.log(player);
    return player;
}

module.exports = Game;