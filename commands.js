var Datastore = require("nedb");
var userNamesDB = new Datastore({ filename: "userNames.db", autoload: true });

userNamesDB.ensureIndex({fieldName: "userName", unique: true});

var cmds = {
  "register": function(id, data){
		if(!Array.isArray(data)){
			var error = {error: "no username/pass array given"};
			helpers.log(error);
			helpers.emit(id, error)
			return;
		 }
		var userName = (data[0] || +new Date()).toString();
		var password = (data[1] || Math.random().toString(36).slice(2)).toString();
		var doc = {"userName": userName, "password": password};
		
		userNamesDB.insert(doc, function(err, newDoc){
			if(err){
				if(err.errorType === "uniqueViolated"){
					var error = {error: "username taken"};
					helpers.log(error);
					helpers.emit(id, error);
				}else{
					var error = {error: "database error 1"};
					helpers.log(error);
				}
			}else{
				// start streaming after register
				helpers.newStreamer(id, userName); 
				helpers.log(doc);
				helpers.emit(id, {"userName": userName, "password": password, "error": 0});
			}
		});
  },
	"stream": function(id, data){
		if(!Array.isArray(data)){
			var error = {error: "no user/pass array given"};
			helpers.log(error);
			helpers.emit(id, error)
			return;
		 }
		
		var userName = (data[0] || "").toString();
		var password = (data[1] || "").toString();
		var obj = {"userName": userName, "password": password};
		
		userNamesDB.findOne(obj, function(err, doc){
			if(err){
				var error = {error: "database error 2"}
				helpers.log(error);
			}else if(doc){
				helpers.newStreamer(id, userName);
				helpers.log(obj);
				helpers.emit(id, {"userName": userName, "password": password, "error": 0});
			}else{
				var error = {error: "wrong username/password"};
				helpers.log(error);
				helpers.emit(id, error);
			}
		});	
	},
	"follow": function(id, userName){
		if(streaming[userName]){
			clients[streaming[userName]].streamer.addViewer(id);
		}else{
			var error = {"error": userName + " is not streaming"};
			helpers.log(error);
			helpers.emit(id, error);
		}
  }, 
  //output from a streamer
  'o': function(id, output){
    // return if not streaming
    if(!clients[id].streamer) return;
    clients[id].streamer.broadcast({'o': output});
  },
   //resize terminal
   //hier weitermachen
  'resize': function(socketId, geometry){ 
    if(!streamer[socketId] || !Array.isArray(geometry)) return;
    log(geometry);
    streamer[socketId].cols = geometry[0] || 80;
    streamer[socketId].rows = geometry[1] || 24;
    streamer[socketId].broadcast({'re': geometry});
  }
}

module.exports = cmds;

var helpers = require('./helpers.js');
