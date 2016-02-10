var config = require('config');

var HIPCHAT = require('./lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);


module.exports = function(game) {

  
  var cmdMapper = [{
    "cmd": "/start",
    "method": function() {
      return game.startGame();
    }
  },
    {
      "cmd":"/join",
      "method":function(message){
        return game.joinPlayer(message.from.name, message.from.id);
      }
    }
  ];

  var lastCheckTimestamp = Date.now();

  var mainLoop = function() {
    // this will list all of your rooms
    hipchat.request('room/1323446/history/latest', function(err, history){
      if(history && history.items) {

        history.items.forEach(function(message) {

          if(new Date(message.date).getTime() > lastCheckTimestamp) {
            lastCheckTimestamp = new Date(message.date).getTime();
            console.log('New message: ' + message.message);
            cmdMapper.forEach(function(cmd) {
              if(message.message.search(cmd.cmd) !== -1) {
                console.log('Found cmd: ' + cmd.cmd);
                var e = cmd.method(message);
                
                console.log("Foo: " + e);
                if(e !== true) {
                  console.log('Error: ' + e);
                }
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