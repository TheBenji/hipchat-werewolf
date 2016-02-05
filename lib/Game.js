var Player = require('./Player');

var Game = function() {
  this.gamePhase = 0; //0 = not started; 1 = waiting for player; 2=night,wolfes;3=night,doc;4=night,seer;5=day
  
  this.players = [];
};

Game.prototype.startGame = function() {
  if(!this.gamePhase === 0) {
    return null;
  }
  
  this.gamePhase = 1;
  //Do all this fancy stuff you gotta do to start a game
}

Game.prototype.joinPlayer = function(name, id) {
  if(!this.gamePhase === 1) {
    return 'Nope';
  }
  
  if(!this.findPlayerById(id)) {
    return 'Nope2';
  }
  
  this.players.push(new Player(id, name);
  
  
}

Game.prototype.findPlayerById = function(id) {
  var self = this;
  var player = null;
  
  self.players.forEach(function(p) {
    if(p.id === id) {
      player = p;
    }
  });
  
  return player;
}

module.exports = Game;