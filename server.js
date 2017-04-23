var template = '<div ng-repeat="item in collection">{{item}}</div><br/>single value: {{testValue1}}';
var templateScope = '{"testValue1":1,"collection":[1,2,3]}';

var express = require('express')
var app = express()
const Browser = require('zombie');
var fs = require('fs');
var htmlmin = require('htmlmin');
var bodyParser = require('body-parser')
var open = require('open');
var pdf = require('html-pdf');

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

function removeFileWithDelay (filePath, delaySec){
	setTimeout(function(){
		fs.unlink(filePath);
	}, delaySec*1000);
}

var buffer = {};

function setBuffer(key, meta, timeInSec){
	if(buffer[key]){
		return false;
	}

	buffer[key] = meta;

	setTimeout(function(){ buffer[key] = undefined; }, timeInSec * 1000);
	return true;
}

function bindHtml(req, res, action){
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

    if(browser.document.title !== 'done'){
      res.send(JSON.stringify({
        error: "Failed to bind template! Error on js side."
      }));
      return;
    }

    var index = compiledTemplate.indexOf('>');
    compiledTemplate = compiledTemplate.substr(index+2,compiledTemplate.length-index-11);

    if(compiledTemplate == req.body.te)

    //clean up any angular specific code after binding
    compiledTemplate = compiledTemplate
      .replace(/(\ )?ng\-binding(\ )?/g,' ')
      .replace(/(\ )?ng\-scope(\ )?/g,' ')
      .replace(/(\ )?ng\-repeat=\"[a-zA-Z0-9\(\)\ ]+(\ )?\"/g,' ');
    
    action({
      result: htmlmin(compiledTemplate),
      time: (Date.now()-start)
    });

    removeFileWithDelay(tempFilePath, 1);
  });
}

app.post('/compile', function (req, res) {
	bindHtml(req, res, function(result){
		res.send(JSON.stringify(result));
	});
})

app.get('/get', function(req, res){
	var data = buffer[req.query.resource||''];
	if(!data){
    	res.send(JSON.stringify({
      		error: "Failed to generate pdf."
    	}));
  		return;	
	}

	res.setHeader('Cache-Control', 'private, s-maxage=0');			
	res.setHeader('Content-Disposition', 'attachment;' + (data.filename?' filename='+data.filename:''));

	if(data.mimeType){
		res.setHeader('content-type', data.mimeType);			
	}

	if(data.stream){
		var stream = data.stream;
		stream.pipe(res);

		stream.on('data', function(data) {
			res.write(data);
		});

		stream.on('end', function() {
			res.end();
		});
	}
});

app.post('/compile-pdf', function(req,res){
	bindHtml(req, res, function(result){
  		var start = Date.now();
		html = result.result;
		var options = { format: 'Letter' };
		pdf.create(html, options).toStream(function(err, stream) {
			if (err){
            	res.send(JSON.stringify({
	          		error: "Failed to generate pdf."
	        	}));
	      		return;
			}

			var meta = {
				filename: 'document.pdf',
				mimeType: 'application/pdf',
				stream: stream
			};
			var time = Date.now() - start;

			var downloadName = (guid()+guid()).replace(/-/g,'');
			var downloadExpire = 5*60;
			while(!setBuffer(downloadName, meta, downloadExpire)){
				downloadName = (guid()+guid()).replace(/-/g,'');
			}

			res.send(JSON.stringify({
				url: 'get?resource='+downloadName,
				expire: Date.now()+(downloadExpire-1)*1000,
				compileTime: result.time,
				pdfCreateTime: time,
				time: time + result.time
			}));
		});
	});
})

app.listen(3000, function () {
	console.log('Server launched on port 3000!')
})

open('http://127.0.0.1:3000');
