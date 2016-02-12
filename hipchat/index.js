var config = require('config');


var HIPCHAT = require('./lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);
var privateMessageIds = [];

module.exports = function (game) {

    game.eventEmitter.on("roomNotification", function (message, roomId) {
        hipchat.postRequest('room/' + roomId + '/message', {"message": message}, function (err, response) {
            console.log("roomNotification  err:" + err);
        });
    });

    game.eventEmitter.on("privateMessage", function (message, id) {
        hipchat.postRequest('user/' + id + '/message', {"message": message, "notify": true}, function (err, response) {
            console.log("privateMessage err:" + err);
        });
    });

    game.eventEmitter.on("listenToMessages", function (id) {
        privateMessageIds.push({"id": id, "lastCheckTimestamp": Date.now()})
    });

    var cmdMapper = [
        {
            "cmd": "/start",
            "method": function () {
                return game.startGame();
            }
        },
        {
            "cmd": "/join",
            "method": function (message) {
                return game.joinPlayer("@" + message.from.mention_name, message.from.id);
            }
        }
    ];

    var lastCheckTimestamp = Date.now();

    var mainLoop = function () {
        // this will list all of your rooms
        hipchat.getRequest('room/' + config.roomId + '/history/latest', function (err, history) {
            if (!err) {

                if (history && history.items) {

                    history.items.forEach(function (message) {

                        if (new Date(message.date).getTime() > lastCheckTimestamp && message.from.id !== config.adminId) {
                            lastCheckTimestamp = new Date(message.date).getTime();
                            console.log('New message: ' + message.message);
                            cmdMapper.forEach(function (cmd) {
                                if (message.message.search(cmd.cmd) !== -1) {
                                    console.log('Found cmd: ' + cmd.cmd);
                                    var e = cmd.method(message);

                                    hipchat.postRequest('room/' + config.roomId + '/message', {"message": e}, function (err, response) {
                                        console.log("err:" + err);
                                        console.log("response:" + response);
                                    });

                                }
                            });
                        }
                    });

                } else {

                    console.log(history)
                }
            }
        });

        privateMessageIds.forEach(function (item) {
            hipchat.getRequest('/user/' + item.id + '/history/latest', function (err, history) {
                if (!err) {
                    history.items.forEach(function (message) {

                        if (new Date(message.date).getTime() > item.lastCheckTimestamp && message.from.id !== config.adminId) {
                            item.lastCheckTimestamp = new Date(message.date).getTime();
                            game.handleMessage(item.id, message.message);
                        }
                    });
                }
            });
        });
    };

    setInterval(mainLoop, 5000);
};