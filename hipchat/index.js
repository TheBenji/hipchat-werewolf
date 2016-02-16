var config = require('config');


var HIPCHAT = require('./lib/hipchat');
var hipchat = new HIPCHAT(config.hipchatAPIKey);
var privateMessageIds = [];

module.exports = function (game) {

    game.eventEmitter.on("roomNotification", function (message, roomId) {
        hipchat.postRequest('room/' + roomId + '/notification', {
            "message": message,
            "notify": true,
            "from": config.notifyName,
            "color": 'purple',
            "message_format": 'text'
        }, function (err, response) {
            console.log("roomNotification  err:" + err);
        });
    });

    game.eventEmitter.on("privateMessage", function (message, id) {
        hipchat.postRequest('user/' + id + '/message', {
            "message": message,
            "notify": true
        }, function (err, response) {
            console.log("privateMessage err:" + err);
        });
    });

    game.eventEmitter.on("listenToMessages", function (id) {
        privateMessageIds.push({"id": id, "lastCheckTimestamp": Date.now()})
    });

    var cmdMapper = [
        {
            "cmd": "/start",
            "method": function (message) {
                return game.startGame();
            }
        },
        {
            "cmd": "/join",
            "method": function (message) {
                return game.addPlayer("@" + message.from.mention_name, message.from.id);
            }
        },
        {
            "cmd": "/kill",
            "method": function (message) {
                if (message.message) {
                    return game.vote(message.from.id, message.message.replace("/kill", "").trim());
                }
            }
        },
        {
            "cmd": "/alive",
            "method": function (message) {
                return game.whoIsAlive();
            }
        },
        {
            "cmd": "/help",
            "method": function (message) {
                return game.help();
            }
        },
        {
            "cmd": "/time",
            "method": function (message) {
                return game.time();
            }
        }
    ];

    var lastCheckTimestamp = Date.now();

    var mainLoop = function () {
        // this will list all of your rooms
        hipchat.getRequest('room/' + config.roomId + '/history/latest', function (err, history) {
            if (!err) {
                if (history && history.items && history.items instanceof Array) {

                    history.items.forEach(function (message) {

                        if (new Date(message.date).getTime() > lastCheckTimestamp && message.from.id !== config.adminId && message.from.mention_name) {
                            lastCheckTimestamp = new Date(message.date).getTime();
                            console.log('New message: ' + message.message);
                            cmdMapper.forEach(function (cmd) {
                                if (message.message.search(cmd.cmd) !== -1) {
                                    console.log('Found cmd: ' + cmd.cmd);
                                    cmd.method(message);
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
                    if (history && history.items && history.items instanceof Array) {
                        history.items.forEach(function (message) {

                            if (new Date(message.date).getTime() > item.lastCheckTimestamp && message.from.id !== config.adminId) {
                                item.lastCheckTimestamp = new Date(message.date).getTime();
                                game.handleMessage(item.id, message.message);
                            }
                        });
                    }
                }
            });
        });
    };

    setInterval(mainLoop, 8000);
};