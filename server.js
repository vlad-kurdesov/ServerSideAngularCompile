var template = '<div ng-repeat="item in collection">{{item}}</div><br/>single value: {{testValue1}}';
var templateScope = '{"testValue1":1,"collection":[1,2,3]}';

var express = require('express')
var app = express()
const Browser = require('zombie');
var fs = require('fs');
var htmlmin = require('htmlmin');
var bodyParser = require('body-parser')
var open = require('open');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var contentsTemplate = fs.readFileSync('template\\angularjs.1.6.1.html', 'ascii');
var indexPage = fs.readFileSync('index.html', 'ascii');

var tempDir = __dirname + "\\temp";

app.get('/', function(req, res){
  res.send(indexPage);
})

app.post('/compile', function (req, res) {
  var start = Date.now();
  var tempFileName = (guid()+guid()).replace(/-/g,'')+".html";
  var tempFilePath = tempDir + "\\"+tempFileName;
  var contents = contentsTemplate;
  contents = contents.replace("%text%",req.body.template);
  contents = contents.replace("%variable%",req.body.variable);
  fs.writeFileSync(tempFilePath, contents);

  var browser = new Browser();
  browser.visit('file://'+tempFilePath, function(a){
    var compiledTemplate = browser.html('body');

    //if(!browser.assert.success()){

    //  res.send(JSON.stringify({
    //    error: "Error compiling template!"
    //  }));

    //  fs.unlink(tempFilePath);
    //  return;  
    //}

    var index = compiledTemplate.indexOf('>');
    compiledTemplate = compiledTemplate.substr(index+2,compiledTemplate.length-index-11);

    //clean up any angular specific code after binding
    compiledTemplate = compiledTemplate
      .replace(/(\ )?ng\-binding(\ )?/g,' ')
      .replace(/(\ )?ng\-scope(\ )?/g,' ')
      .replace(/(\ )?ng\-repeat=\"[a-zA-Z0-9\(\)\ ]+(\ )?\"/g,' ');
    
    res.send(JSON.stringify({
      result: htmlmin(compiledTemplate),
      time: (Date.now()-start)
    }));

    fs.unlink(tempFilePath);
  });
})

app.listen(3000, function () {
  console.log('Server launched on port 3000!')
})

open('http://127.0.0.1:3000');
