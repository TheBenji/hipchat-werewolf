var config = require('config');

var HIPCHAT = require('./hipchat/lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);

// this will list all of your rooms
hipchat.request('room', function(err, rooms){

  console.log(err);
  console.log(rooms)
});