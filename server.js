var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var clients = {};
var streamer = {};
var viewer = {};
var registeredNames = {};

var cmds = {
  //register
  'r': function(socketId, userName){
    var token = Math.random().toString(36).slice(2);
    if(streamer[socketId]){
      clients[socketId].send(JSON.stringify({'error': 'Already registered'}));
      return;
    } 
    if(!userName){
      do{
        var userName = Math.random().toString(36).slice(2);
      }while(registeredNames.hasOwnProperty(userName));
    }

    if(registeredNames.hasOwnProperty(userName)){
      clients[socketId].send(JSON.stringify({'error': 'Username already taken'}));
    }else{
      //nyi: make persistent with db
      registeredNames[userName] = socketId;
      streamer[socketId] = {
        userName: userName,
        token: token,
        password: null,
        viewers: [],
        rows: null,
        cols: null,
        socket: clients[socketId],
        broadcast: function(msg){
          this.viewers.forEach(function(viewer){
            clients[viewer].send(JSON.stringify(msg));
          });
        },
        addViewer: function(viewer){
          if(this.viewers.indexOf(viewer) === -1){
            this.viewers.push(viewer);
           }
        },
        removeViewer: function(viewer){
         var index = this.viewers.indexOf(viewer); 
          if(index > -1){
            this.viewers.splice(index, 1);  
          }
        }
      }; 
      clients[socketId].send(JSON.stringify({'userName': userName, 'token': token}));
    }
  },
  //shell output from a streamer
  'o': function(socketId, output){
    // return if not registered
    if(!streamer[socketId]) return;
    streamer[socketId].broadcast(output);
    
  },
  //new viewer to streamer 
  'v': function(socketId, userName){
    if(streamer[registeredNames[userName]]){
      streamer[registeredNames[userName]].addViewer(socketId);
      if(viewer[socketId]){
        viewer[socketId].push(userName);
      }else{
        viewer[socketId] = [userName];
      }
    }
  },
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
