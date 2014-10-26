var cmds = require('./commands.js')

exports.validate = function(msg, id){
  try{
    json = JSON.parse(msg);
  }catch(exception) {
    json = null;
    var error = {error: "invalid json"};
    this.log(error);
		this.emit(id, error);
    return;
  }

  if(json && cmds.hasOwnProperty(Object.keys(json)[0])){
    return json;
  }else{
    var error = {error: "invalid command"};
    this.log(error);
		this.emit(id, error);
    return false;
  }
}

exports.newStreamer = function(id, userName){
	streaming[userName] = id;
	var _this = this;
	clients[id].streamer = {
		"socketId": id,
		"userName": userName,
		"password": null,
		"viewers": [],
		"rows": null,
		"cols": null,
		"broadcast": function(msg){
			_this_ = this;
			this.viewers.forEach(function(viewer){
        msg["f"] = _this_.userName;
        console.log(msg);
				_this.emit(viewer, msg);
			});
		},
		"addViewer": function(viewer){
			if(this.viewers.indexOf(viewer) === -1){
				this.viewers.push(viewer);
				clients[viewer].following.push(this.userName);
				_this.emit(this.socketId, {"viewer": this.viewers.length});
			}
		},
		"removeViewer": function(viewer){
		 var index = this.viewers.indexOf(viewer); 
			if(index > -1){
				this.viewers.splice(index, 1);
				_this.log(this.userName, "removed viewer");
				_this.emit(this.socketId, {"viewer": this.viewers.length});
			}
		}
	};  
}

exports.log = function(){
  var s = "";
  for(var i = 0; i < arguments.length; i++){
    if(typeof(arguments[i]) === "object"){
      s += JSON.stringify(arguments[i]) + ' ';
    }else{
      s += arguments[i] + ' ';
    }
  }
	console.log(new Date().toJSON(), "|", s);
}

exports.emit = function(id, json){
	clients[id].ws.send(JSON.stringify(json));
}


