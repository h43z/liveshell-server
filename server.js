var io = require('socket.io')();
var crypto = require('crypto');
var net = require('net');
var events = require('events');
var emitter = new events.EventEmitter();

var streams = {}

var tcpserver = net.createServer(function(c){
  var id;
  console.log('New tcp streamer');
  do{
   id = Math.random().toString(36).substr(2, 6);
  }while(streams.hasOwnProperty(id))
  
  id = "1";

  streams[id] = {size:{ cols: 80, rows:20}};
  c.write('{id:' + id + '}');

  c.on('data', function(output){
    emitter.emit(id + '_o', output);
  }); 
  
  c.on('end', function(){
    console.log('Disconnect from tcp streamer');
    delete streams[id];
  });

  c.on('error', function(err){
    console.log('tcp error', err);
  });
});

io.on('connection', function(socket){
  var id;

  socket.on('register', function(){
    do{
      id = Math.random().toString(36).substr(2, 6);
    }while(streams.hasOwnProperty(id))

    socket.join(id);
    streams[id] = {size:{ cols: 80, rows:20}};
    socket.emit('registered', id);
    console.log('New socket.io streamer');
  });

  socket.on('view', function(streamId){
		console.log('New viewer to', streamId);
    if(streams.hasOwnProperty(streamId)){
      // socket !? wtf testen
      emitter.on(streamId + '_o', function(output){
        socket.emit('o', output + '');
      });
      socket.join(streamId);
      socket.emit('resize', streams[streamId].size);
    }
  });
  
  socket.on('o', function(output){
    socket.to(id).emit('o', output);  
  });

  socket.on('resize', function(data){
    streams[id].size = data;
    socket.to(id).emit('resize', data);
  });
  
  socket.on('disconnect', function(){
    console.log('Disconnect from socket.io');
    delete streams[id];
  });

});

io.listen(443)
tcpserver.listen(8888);
