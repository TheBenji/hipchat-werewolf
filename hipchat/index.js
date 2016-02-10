var config = require('config');


var HIPCHAT = require('./lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);


module.exports = function(game) {

  game.eventEmitter.on("roomNotification", function (message) {
      hipchat.postRequest('room/'+config.roomId+'/message', {"message":message},function(err,response){
          console.log("err:"+err);
          console.log("response:"+response);
      });
  });

  game.eventEmitter.on("privateMessage", function (message, id) {
      hipchat.postRequest('user/'+id+'/message', {"message":message, "notify":true},function(err,response){
          console.log("err:"+err);
          console.log("response:"+response);
      });
  });
  
  var cmdMapper = [{
    "cmd": "/start",
    "method": function() {
      return game.startGame();
    }
  },
    {
      "cmd":"/join",
      "method":function(message){
        return game.joinPlayer("@"+message.from.mention_name, message.from.id);
      }
    }
  ];

  var lastCheckTimestamp = Date.now();

  var mainLoop = function() {
    // this will list all of your rooms
    hipchat.getRequest('room/'+config.roomId+'/history/latest', function(err, history){
      if(history && history.items) {

        history.items.forEach(function(message) {

          if(new Date(message.date).getTime() > lastCheckTimestamp&& message.from.id!==config.adminId) {
            lastCheckTimestamp = new Date(message.date).getTime();
            console.log('New message: ' + message.message);
            cmdMapper.forEach(function(cmd) {
              if(message.message.search(cmd.cmd) !== -1) {
                console.log('Found cmd: ' + cmd.cmd);
                var e = cmd.method(message);
                
                hipchat.postRequest('room/'+config.roomId+'/message', {"message":e},function(err,response){
                    console.log("err:"+err);
                    console.log("response:"+response);
                });
                
              }
            });
          }
        });

      } else {
        
        console.log(history)
      }
    });
  }

  setInterval(mainLoop, 5000);
};