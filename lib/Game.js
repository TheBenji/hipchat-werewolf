var config = require('config');
var EventEmitter = require("events").EventEmitter;
var Player = require('./Player');

var Game = function () {
    var self = this;
    this.gamePhase = 0; //0 = not started; 1 = waiting for player; 2=night;5=day
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
            this.assignPlayers();
            this.night();
        }
    }

    if (this.gamePhase == 2 && this.startedTimeStamp + config.durations.two < Date.now()) {
        var result = this.checkVotes();
        if (result) {
            player = this.findPlayerById(result);
            player.dead = true;
            this.eventEmitter.emit("roomNotification", player.name + " is now dead!", config.roomId);
        } else {
            this.eventEmitter.emit("roomNotification", "wolfs are more like little kitties, haven't killed anyone!", config.roomId);
        }

        this.day();
    }
    if (this.gamePhase == 5 && this.startedTimeStamp + config.durations.three < Date.now()) {
        var result = this.checkVotes();
        if (result) {
            player = this.findPlayerById(result);
            player.dead = true;
            this.eventEmitter.emit("roomNotification", player.name + " is now dead!", config.roomId);
        } else {
            this.eventEmitter.emit("roomNotification", "nobody died", config.roomId);
        }

        this.night();
    }
}

Game.prototype.day = function () {
    var self = this;
    //set game phase to day
    self.gamePhase = 5;

    self.clearPlayers();


    //Send message that it's day now
    this.eventEmitter.emit("roomNotification", "Wakey wakey, it is day. Type '/vote @mention' to give your vote who you want to hang", config.roomId);

};

Game.prototype.night = function () {
    var self = this;

    self.gamePhase = 2;

    self.clearPlayers();

    this.eventEmitter.emit("roomNotification", "It is night!", config.roomId);
    this.players.forEach(function (player) {
        if (player.role == 2) {
            self.eventEmitter.emit("privateMessage", "Choose person to kill by using his @name", player.id);
        }
    });

}

Game.prototype.vote = function (playerId, voteName) {
    var player = this.findPlayerById(playerId);

    if (!player.dead && this.gamePhase == 5) {
        //check if player is valid target
        var target = this.findPlayerByName(voteName);

        if (target && !target.dead) {
            player.votedFor = target.id;
            return this.eventEmitter.emit("roomNotification", player.name + " voted for " + target.player, config.roomId);
        } else {
            return this.eventEmitter.emit("roomNotification", target.name + " is not a valid target", config.roomId);
        }
    } else {
        this.eventEmitter.emit("privateMessage", player.name + ", you can't vote right now", player.id);
    }

    //Otherwise tell them that they can't vote right now
};

Game.prototype.kill = function (playerId, voteName) {
    var player = this.findPlayerById(playerId);
    if (player.role == 2) {
        if (!player.dead && this.gamePhase == 2) {
            //check if player is valid target
            var target = this.findPlayerByName(voteName);

            if (target && !target.dead) {
                player.votedFor = target.id;
                return this.eventEmitter.emit("privateMessage", "You choosed to kill: " + target.name, player.id);
            } else {
                return this.eventEmitter.emit("privateMessage", "You can't kill this person", player.id);
            }
        } else if (player.dead) {
            return this.eventEmitter.emit("privateMessage", "You are dead shut up!", player.id);
        } else {
            return this.eventEmitter.emit("privateMessage", "It is not night!", player.id);
        }
    }
};


Game.prototype.handleMessage = function (id, message) {
    this.kill(id, message);
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

Game.prototype.checkVotes = function () {
    var votes = [];

    var addCount = function (playerId) {
        var found = false;
        votes.forEach(function (v) {
            if (v.id == playerId) {
                v.count++;
                found = true;
            }
        });

        if (!found) {
            votes.push({id: playerId, count: 1});
        }
    };
    this.players.forEach(function (player) {
        if (player.votedFor) {
            addCount(player.votedFor);
        }
    });

    votes.sort(function (a, b) {
        if (a.count > b.count) {
            return 1;
        } else if (a.count < b.count) {
            return -1;
        } else {
            return 0;
        }
    });

    //draw, invalid
    if ((vote.length >= 2 && votes[0].count == votes[1].count) || votes.length == 0) {
        return false;
    }

    return vote[0].id;
};

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

Game.prototype.clearPlayers = function () {
    this.players.forEach(function (player) {
        player.votedFor = null;
    });
};

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
};

Game.prototype.findPlayerByName = function (name) {
    var self = this;
    var player = null;
    self.players.forEach(function (p) {
        if (p.name === name.toLowerCase()) {
            player = p;
        }
    });
    console.log(player);
    return player;
};

Game.prototype.checkWinConditions = function () {
    //The game is won by the wolfs if there villagers == wolfs
    //and the villages won if wolfs == 0

    var wolfs = 0;
    var villagers = 0;

    this.players.forEach(function (player) {
        if (!player.dead && player.role == 2) {
            wolfs++;
        }

        if (!player.dead && player.role != 2) {
            villagers++;
        }
    });

    if (wolfs >= villagers) {
        return 2; //wolfs won
    }

    if (wolfs == 0) {
        return 1; //villagers won
    }

    return false; //no team won yet
};

module.exports = Game;