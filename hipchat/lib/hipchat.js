var request = require('request');

var Hipchat = function (token, api_root) {
    this.token = token;
    this.api_root = api_root || 'https://api.hipchat.com/v2/';
}


Hipchat.prototype.getRequest = function (endpoint, callback) {
    var self = this;

    try {
        request(self.api_root + endpoint + '?auth_token=' + self.token, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                return callback(null, JSON.parse(body));
            }

            return callback(err, JSON.parse(body));
        });
    } catch (e) {
        //Ignore errors for now..
        console.log('Error in request: ');
        console.log(e); 
    }
};

Hipchat.prototype.postRequest = function (endpoint, postObject, callback) {
    var self = this;
    try {
        request({
            url: self.api_root + endpoint + '?auth_token=' + self.token,
            method: "POST",
            json: postObject
        }, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                return callback(err, body);
            }

            return callback(err, body);
        });
    } catch (e) {
        //Ignore errors for now..
        console.log('Error in request: ');
        console.log(e);
    }
};


Hipchat.prototype.deleteRequest = function (endpoint, postObject, callback) {
    var self = this;
    request({
        url: self.api_root + endpoint + '?auth_token=' + self.token,
        method: "DELETE",
        json: postObject
    }, function (err, res, body) {
        if (!err && res.statusCode == 200) {
            return callback(null, body);
        }

        return callback(err, body);
    });
};


module.exports = Hipchat;

