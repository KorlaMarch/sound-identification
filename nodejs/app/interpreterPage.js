var sound = require("models/sound.js");
var command = require("models/command.js");
var testcase = require("models/testcase.js");
var soundScript = require("models/soundScript.js");
var config = require("config.js");
var Log = require("logger.js");
var scriptInterpreter = require("scriptInterpreter.js");
var path = require("path");
var fs = require("fs");

module.exports = function(app){
	
	app.get("/interpreter", function(req, res){
		res.render("../views/interpreter.ejs",{
			"streamName" : "stream_interpreter",
			"heading" : "Script Interpreter",
			"scriptList" : soundScript.prototype.fileList
		} );
	});

	app.get("/stream_interpreter", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		var script = new soundScript();
		script.load(req.query.file, ()=>{
			scriptInterpreter(logger).runScript(script, (re)=>{
				re.save();
				res.end();
			});
		});

	});

	app.get("/runall", function(req, res){
		res.render("../views/interpreter.ejs",{
			"streamName" : "stream_runall",
			"heading" : "Script runall",
			"scriptList" : soundScript.prototype.fileList
		} );
	});

	app.get("/stream_runall", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		runNext(12);
		
		function runNext(x){
			if(x>=soundScript.prototype.fileList.length){
				logger.sum("All Done!!");
				res.end();
			}else{
				var script = new soundScript();
				script.load(soundScript.prototype.fileList[x].file, ()=>{
					logger.sum("Run " + x + " " + script.id);
					scriptInterpreter(logger).runScript(script, (re)=>{
						re.save();
						runNext(x+1);
					});
				});
			}
		}

	});
}