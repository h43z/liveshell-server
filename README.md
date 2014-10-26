##Start server with
```
npm start
```
or
```
node server.js
```
##Run tests with
```
npm test
```
##Commands
* {"register": []}
* {"register": ["username"]}
* {"register": ["","password"]}
* {"register": ["username","password"]}
* {"login": ["username", "password"]}
* {"follow": "username"}
* {"o": "cli output broadcasted to my followers"}
* {"resize": [100,120]}

connect with wscat -c ws://localhost:8080
