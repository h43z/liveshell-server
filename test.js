var assert = require("assert");
var should = require("should");
var WebSocket = require("ws");
var userName;

describe("Invalid json", function(){
  it("should notice broken json", function(done){
    var ws = new WebSocket("ws://localhost:8080");
    ws.on("open", function(){
      ws.send("xxx");
      ws.on("message", function(msg){
        assert.deepEqual(JSON.parse(msg), {error: "invalid json"});   
        done();
      });
    });
  });
});

describe("Invalid command", function(){
  it("should notice invalid command", function(done){
    var ws = new WebSocket("ws://localhost:8080");
    ws.on("open", function(){
      ws.send("{}");
      ws.on("message", function(msg){
        assert.deepEqual(JSON.parse(msg), {error: "invalid command"});   
        done();
      });
    });
  });
});

describe("Register command", function(){
  userName = Math.random().toString(36).slice(2); 
  
  describe("register with new (random) username",function(){
    it("should return user object", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
        var password = "pass123";
        ws.send('{"register": ["' + userName + '","' + password + '"]}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {userName: userName, password: password, error: 0});   
          done();
        });
      });
    });
  });
 
  describe("register with already taken username",function(){
    it("should say username already taken", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
        var password = "pass123";
        ws.send('{"register": ["' + userName + '","' + password + '"]}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {error: "username taken"});   
          done();
        });
      });
    });
  });

  describe("register with missing user/pass array",function(){
    it("should show error", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
        var password = "pass123";
        ws.send('{"register": 1}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {error: "no username/pass array given"});   
          done();
        });
      });
    });
  });

  describe("register with empty user/pass array",function(){
    it("should create random username and password", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
        var password = "pass123";
        ws.send('{"register": []}');
        ws.on("message", function(msg){   
					JSON.parse(msg).password.should.be.ok; 
					JSON.parse(msg).userName.should.be.ok; 
          done();
        });
      });
    });
  });

});

describe("Login command", function(){
 
  describe("login with wrong username/password",function(){
    it("should show error", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
				var userName = Math.random().toString(36).slice(2);
        var password = "xxxxx";
        ws.send('{"login": ["' + userName + '","' + password + '"]}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {error: "wrong username/password"});   
          done();
        });
      });
    });
  });

  describe("login with missing username/password",function(){
		it("should show error", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
				var userName = Math.random().toString(36).slice(2);
        var password = "xxxxx";
        ws.send('{"login": 1}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {error: "no user/pass array given"});   
          done();
        });
      });
    });
  });
  
  describe("login with existing user creds",function(){
		it("should return username and password", function(done){
      var wsc = new WebSocket("ws://localhost:8080");
      wsc.on("open", function(){
        wsc.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {userName: userName, password: "pass123", error: 0});   
          done();
        });
          wsc.send('{"login": ["' + userName + '","pass123"]}');
      });
    });
  });


});

describe("Follow command", function(){
  
  describe("follow non streaming user",function(){
    it("should show error", function(done){
      var ws = new WebSocket("ws://localhost:8080");
      ws.on("open", function(){
        ws.send('{"follow": "000_NONEXISTING"}');
        ws.on("message", function(msg){
          assert.deepEqual(JSON.parse(msg), {"error": "000_NONEXISTING is not streaming"});   
          done();
        });
      });
    });
  });
  
  describe("follow streamer and get his output",function(){
		it("should show output of streamer", function(done){
			var ws1 = new WebSocket("ws://localhost:8080");
			var ws2 = new WebSocket("ws://localhost:8080");
			ws1.on("open", function(){	
				ws2.on("open", function(){
					
					ws1.once("message", function(msg){
						ws2.send('{"follow": "' + userName + '"}', function(err){
								ws1.send('{"o": "hello"}');
							});	
					});		
					ws2.on("message", function(msgx){
						assert.deepEqual(JSON.parse(msgx), {"o": "hello","f": userName});   
						done();
					});	
					ws1.send('{"login": ["' + userName + '","pass123"]}');
				});	
			});
    });
  });
});




