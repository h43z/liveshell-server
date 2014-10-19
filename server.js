var WebSocketServer = require('ws').Server;
var stream = new WebSocketServer({port: 8080, path: "/stream"});
var view = new WebSocketServer({port: 8081, path: "/view"});

stream.on('connection', function(ws){
  console.log('new stream connection');
  ws.on('message', function(msg) {
    var json = validate(msg);
    if(json){
      router(json);
    }
  });
 
  ws.send('hello streamer');
});

view.on('connection', function(ws){
  console.log('new view connection');
  ws.on('message', function(msg) {
    var json = validate(msg);
    if(json){
      router(json);
    }
  });
 
  ws.send('hello viewer');
});

var cmds = {
  'o': function(data){
    console.log(data);     
  },
}

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

function router(json){
  cmds[Object.keys(msg)[0]](msg[Object.keys(msg)[0]]);
}



/*

io.on('connection', function(socket){
  console.log('New socket connection with id',  socket.id);
  var id;

  socket.on('register', function(){    
    id = crypto.createHash('md5').update(socket.id).digest('hex');
		streams[id] = {size:{}};
    socket.emit('registered', id);
    socket.join(id);
    console.log('New streamer registered with id', id);
  });

  socket.on('view', function(streamId){
		console.log('New viewer to', streamId);
    if(streams.hasOwnProperty(streamId)){
      socket.join(streamId);
      socket.emit('resize', streams[streamId].size);
    }
  });

  socket.on('o', function(data){
    socket.to(id).emit('o', data);
  });

  socket.on('resize', function(data){
    streams[id].size = data;
    socket.to(id).emit('resize', data);
  });
  
  socket.on('disconnect', function(){
    console.log('Disconnect from id', socket.id);
    delete streams[id];
  });

});

io.listen(443);
*/
