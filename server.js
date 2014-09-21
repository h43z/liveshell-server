var io = require('socket.io')();
var crypto = require('crypto');

var streams = {};

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

