## Server Side Angular Template Compiler
Project was written for-fun during my visit to Dev Code Camp MN, 2017..

This project provides website + Api (without any security) that shows how you could possibly use client-side binding mechanisms to generate template that you could send later via Email or SMS or any other delivery mechanism.

Currently it works only with AngularJS 1.6.1 bindings. And relies on cndjs.cloudflare.com to load proper JavaScript libraries (it would be much faster to have copies of those files on your local drive if you have slow connection).

# Setup

Don't forget to install node packages after you download it:
```
npm install
```
* if you don't have Node installed - please install it first.

In order to start running this servers, simply run next statement in gitbash / command line:
```
node server.js
```

# Api spec
Server hosts everything using ExpressJS on port 3000 (by default) - http://localhost:3000

- POST /compile
request:
```
{
	"template":"<-- angular js template that you want to compile -->""
	"variable":"<-- object (scope) of variables that you want to apply on template, serialized in JSON -->"
}
```
response:
```
{
	"result":"<-- compiled template -->",
	"time": <-- time in milliseconds that it took server to generate response -->
}
```

- POST /compile-pdf
request:
```
{
	"template":"<-- angular js template that you want to compile -->""
	"variable":"<-- object (scope) of variables that you want to apply on template, serialized in JSON -->"
}
```
response:
```
{
	"compileTime": <-- time in milliseconds that it took server to compile template -->,
	"expire": <-- absolute time when file will expire on server -->,
	"pdfCreateTime": <-- time in milliseconds that it took server to generate pdf from compiled template -->,
	"time": <-- total time in milliseconds that it took server to generate response -->,
	"url": "<-- url that you should use to pull generate file from server via GET request"
}
```
Note: url will start with "get?..." and you need to make GET request to /get?.. url in order to pull file.

Simple html client that is hosted on server as well uses all those methods.

# Todo:
- add versioning for different angularjs templates & research which template engines could be added
- create docker image + setup cluster to run multiple instances
- figure out how to protect servers from anonymous use
- zombiejs breaks on '<!-' symbols, need to research how to work around this issue
