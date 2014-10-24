var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});
var Datastore = require('nedb');
var registeredNamesDB = new Datastore({ filename: 'registeredNames.db', autoload: true });

var DEBUG = true;
var clients = {};
var streamer = {};
var viewer = {};
var registeredNames = {};

var cmds = {
  //register or login
  "r": function(socketId, data){
    if(streamer[socketId]){
      clients[socketId].send(JSON.stringify({"error": "Already registered"}));
      return;
    }
    
    if(Array.isArray(data)){
			// streamer tries to login
			var userName = data[0];
			var token = data[1];
			registeredNamesDB.findOne({"userName": userName, "token": token}, function(err, doc){
				if(doc && !err){
					registeredNames[userName] = socketId;
					newStreamer(socketId, token, userName);
					clients[socketId].send(JSON.stringify({"error":"0", "userName": userName, "token": token}))
				}else{
					clients[socketId].send(JSON.stringify({"error":"Wrong password/username"}));
				}
			});
		}else{
			// streamer tries to register
			var token = Math.random().toString(36).slice(2);
			var userName = data.toString() || Math.random().toString(36).slice(2);
			registeredNamesDB.findOne({"userName": userName}, function(err, doc){
				if(!doc && !err){
					registeredNamesDB.insert({"userName": userName, "token": token}, function(err, newDoc){
						registeredNames[userName] = socketId;
						newStreamer(socketId, token, userName);
						clients[socketId].send(JSON.stringify({"error": "0", "userName": userName, "token": token}));	
					});
				}else{
					clients[socketId].send(JSON.stringify({"error": "Username " + userName + " already taken"}));
				}
			});
		}
  },
  //output from a streamer
  'o': function(socketId, output){
    // return if not streaming
    if(!streamer[socketId]) return;
    streamer[socketId].broadcast({'o': output});
  },
  //viewer follows output of streamer 
  'v': function(socketId, userName){
    if(streamer[registeredNames[userName]]){
      streamer[registeredNames[userName]].addViewer(socketId);
      if(viewer[socketId]){
        viewer[socketId].push(userName);
      }else{
        viewer[socketId] = [userName];
      }
    }else{
		  clients[socketId].send(JSON.stringify({"error": userName + " is not streaming"}));
    }
  },
   //resize terminal
  're': function(socketId, geometry){ 
    if(!streamer[socketId] || !Array.isArray(geometry)) return;
    log(geometry);
    streamer[socketId].cols = geometry[0] || 80;
    streamer[socketId].rows = geometry[1] || 24;
    streamer[socketId].broadcast({'re': geometry});
  }
}

wss.on('connection', function(ws){
  console.log('new stream connection');
  var socketId = ws.upgradeReq.headers['sec-websocket-key'];
  clients[socketId] = ws;

  ws.on('message', function(msg) {
    var json = validate(msg);
    if(json){
      cmds[Object.keys(json)[0]](socketId, json[Object.keys(json)[0]]);
     }
  }); 

  ws.on('close', function(){
    if(viewer[socketId]){
      viewer[socketId].forEach(function(userName){
        streamer[registeredNames[userName]].removeViewer(socketId);
      });
    }
    delete streamer[socketId];
    delete clients[socketId];
  });
});

function validate(msg){
  try{
    json = JSON.parse(msg);
  }catch(exception) {
    json = null;
    console.log('Invalid json');
    return;
  }

  if(json && cmds.hasOwnProperty(Object.keys(json)[0])){
    return json;
  }else{
    console.log('Invalid cmd');
    return false;
  }
}

function newStreamer(socketId, token, userName){
	streamer[socketId] = {
    "socket": clients[socketId],
		"userName": userName,
		"token": token,
		"password": null,
		"viewers": [],
		"rows": null,
		"cols": null,
		"broadcast": function(msg){
			this.viewers.forEach(function(viewer){
        msg["f"] = streamer[socketId].userName;
				clients[viewer].send(JSON.stringify(msg));
        log('send',msg,'to', viewer);
			});
		},
		"addViewer": function(viewer){
			if(this.viewers.indexOf(viewer) === -1){
				this.viewers.push(viewer);
        this.socket.send(JSON.stringify({"vu": this.viewers.length})); 
			 }
		},
		"removeViewer": function(viewer){
		 var index = this.viewers.indexOf(viewer); 
			if(index > -1){
				this.viewers.splice(index, 1);  
        this.socket.send(JSON.stringify({"vu": this.viewers.length})); 
			}
		}
	};  
}

function log(){
	if(!DEBUG) return;
  var s = '';
  for(var i = 0; i < arguments.length; i++){
    if(typeof(arguments[i]) === 'object'){
      s += JSON.stringify(arguments[i]) + ' ';
    }else{
      s += arguments[i] + ' ';
    }
  }
	console.log(new Date().toJSON(), '|', s);
}
