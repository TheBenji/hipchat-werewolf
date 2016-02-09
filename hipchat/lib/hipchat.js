var request = require('request');

var Hipchat = function(token, api_root) {
    this.token = token;
    this.api_root = api_root || 'https://api.hipchat.com/v2/';
}


Hipchat.prototype.request = function(endpoint, callback) {
  var self = this;
  
  request(self.api_root + endpoint + '?auth_token='+ self.token, function(err, res, body) {
    if(!err && res.statusCode === 200) {
      return callback(null, JSON.parse(body));
    }
    
    return callback(err, JSON.parse(body));
  });
}

module.exports = Hipchat;

