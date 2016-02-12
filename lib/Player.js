var Player = function (id, name) {
    this.name = name;
    this.id = id;

    this.role = false;//1 - peasent, 2 - wolf, 3 -seer, 4 -doctor
    this.dead = false;
    
    this.votedFor = null;

};

module.exports = Player;