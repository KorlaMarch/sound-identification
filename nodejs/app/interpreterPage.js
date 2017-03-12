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
}