# Node Ddos Protector

This package is a highly customizable, easy to use ddos protector. It bans an attacker which made continuous requests to a website in certain timespan and amount of count. When an attacker detected depending on your options, it returns error code and you have to handle that code in middlewares or routes.

You have to set the options first:

```javascript

// this is your options, set it depending on your need.

// Default options are these:

let options = {
    attackTimespan: 30, 
    attackCount: 20,
    banTime: 7200,
    errorCode: 429
}

// their meaning:

// attackTimespan - this setting is for in which timespan that attacker makes certain amount of request to ban him as seconds. 

// attackCount - this is for how many request that an attacker made to ban him.

// banTime - How many seconds to ban an attacker.

// errorCode - which error code do you want to return if an attacker detected.

```

And here is initialization:

```javascript

let { DdosProtector } = require("node-ddos-protector");

// you need to initialize it on global scope:

let options = {
    attackTimespan: 30, 
    attackCount: 20,
    banTime: 7200,
    errorCode: 429
}

let protector = new DdosProtector().init(options);

```

If you want, you can open an whitelist, which takes an argument as either a string array or the path of a file which includes ip addresses:

```javascript

// same setup with previous example

// since in localhost ip values takes that value, you have to give that value for being able to test it on localhost.
// in production you have to add real ip values to that list:

let protector = new DdosProtector().init(options).openWhitelist(["::1"]) 

```

Or you can do that thing:

```javascript

// i strongly recommend to use path module for defining platform-agnostic paths:

let path = require("path");

let logPath = path.join(process.cwd(), "logs", "whitelist.txt");

let protector = new DdosProtector().init(options).openWhitelist(logPath);

```

You have to write your whitelisted ip's with that synthax:

64.355.234.643
87.434.553.236
117.434.263.674

## Documentation

You can use it with every framework that you want if you can reach request and response objects on same time. If that request not includes `req.socket.remoteAddress` then you have to manually add it or you can't use it.

Here is some examples from frameworks:

### Express.js Example

Since express.js's middlewares blocking if you don't call `next()` function, you can not use that function if an attacker detected. For example, you can use it like that:

```javascript

let server = require("express")();
let { DdosProtector } = require("node-ddos-protector");

let options = {
    attackTimespan: 30,
    attackCount: 5,
    banTime: 60,
    errorCode: 429
}

let protector = new DdosProtector().init(options);

server.use("/", function(req, res, next){
    protector.handleBanningAndAllowing(req, res).logEverything();

    if(res.statusCode === 429){
        res.end("429 too many requests");
    } else {
        next();
    }
})

server.get("/", function(req, res){
    res.send("<h1>Hello</h1>")
});

server.listen(3000);

```

### Neback.js Example

Since it's originally designed for <a href="https://www.npmjs.com/package/neback">Neback.js<a> Framework, that protector is built-in feature on that framework and especially designed for that. You can use it on that framework like that:

```javascript

let { Neback } = require("neback/neback-core.js");
let { DdosProtector } = require("neback/neback-utils.js");

let server = new Neback();

let ddosProtector = new DdosProtector().init({ attackCount: 20, attackTimespan: 30, banTime: 7200, errorCode: 429 });

server.middleware("/", function(req, res){
    ddosProtector.handleBanningAndAllowing(req, res).logEverything();

    if(res.statusCode === 429){
        return res.end("You're banned!");
    }
})

server.get("/", function(req, res){
    server.sendHtml(res, "<h2>Contact sahifesinden merhaba!</h2>");
})

server.start(3000);

```

### Vanilla Node.js Setup

If you have a simple vanilla node.js server, you can use that package like that:

```javascript

let http = require("http");
let { DdosProtector } = require("node-ddos-protector");

let protector = new DdosProtector().init({ 
    banTime: 7200, 
    attackCount: 20, 
    attackTimespan: 30, 
    errorCode: 429 
});

http.createServer(function(req, res){
    if(req.method === "GET" && req.url === "/"){
        protector.handleBanningAndAllowing(req, res);

        // your other stuff

        if(res.statusCode === 429){
            res.setHeader("Content-Type", "text/plain")
            res.end("429 too many requests");
        } else {
            // return whatever you want
        }
    }
}).listen(3000);

```

## Planned Improvements

We are planned to add that features:

* option for writing every log on a file

* option for writing individual logs on individual files

* option for writing only banned ip's

## Stability

It's tested with the previous examples, it's pretty much complete in my opinion. If you have issues about that liblary, you can report it via github issues.