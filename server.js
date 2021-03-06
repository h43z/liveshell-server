var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var cmds = require('./commands.js');
var helpers = require('./helpers.js');

clients = {};
// save connection between username and socket id
// lookup socket id with streaming[userName]
streaming = {}

var streamer = {};
var viewer = {};
var registeredNames = {};

wss.on('connection', function(ws){
  var socketId = ws.upgradeReq.headers['sec-websocket-key'];
  socketId += Math.random().toString(36).slice(2);
  clients[socketId] = {ws: ws, streamer: null, following: []};
  helpers.log("new connection", socketId);

  ws.on('message', function(msg){
		helpers.log(msg);
    var json = helpers.validate(msg, socketId);
    if(json){
      cmds[Object.keys(json)[0]](socketId, json[Object.keys(json)[0]]);
     }
  }); 

  ws.on('close', function(){
		if(!clients[socketId]) return;
		helpers.log("removed connection", socketId);
		clients[socketId].following.forEach(function(streamer){
			if(clients[streaming[streamer]]){
				clients[streaming[streamer]].streamer.removeViewer(socketId);
			}
		});
		delete clients[socketId];
		delete streaming[socketId];
  });

  ws.on('error', function(err){
    helpers.log(err);
  });
});
