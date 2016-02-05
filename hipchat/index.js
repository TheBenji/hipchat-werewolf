var config = require('config');

var HIPCHAT = require('./hipchat/lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);

var mainLoop = function() {
  // this will list all of your rooms
  hipchat.request('room/1323446/history', function(err, history){

    console.log(history);
  });
}

setInterval(mainLoop, 1000);