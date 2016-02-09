var Player = function(id, name) {
  this.name = name;
  this.id = id;
  
  this.role;
  this.dead = false;
  
};

module.exports = Player;