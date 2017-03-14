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
	
	app.get("/genscript", function(req, res){
		res.render("../views/genscript.ejs",{
			"streamName" : "stream_genscript",
			"heading" : "Script Generator",
			"testList" : testcase.prototype.fileList
		} );
	});

	app.get("/stream_genscript", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		logger.sum("Generate script with file " + req.query.testcase);

		var script = new soundScript(req.query.name,req.query.name,req.query.name);

		var windows = ['R','T','H','M','B','F'];
		var distance = ['E','M'];
		var kcon = [1,2,3,4,5];

		for(var i = 0; i < windows.length; i++){
			for(var j = 0; j < distance.length; j++){
				for(var k = 0; k < kcon.length; k++){
					var comm = new command(command.prototype.commandType.GroupRun,true);
					comm.file = req.query.testcase;
					comm.args = ["-f",config.knnDB_file,"-w",windows[i],"-d",distance[j],"-k",kcon[k].toString(),"-nb"];
					if(k==0) comm.isClean = true;
					else comm.isClean = false;
					logger.info("add " + comm.args);
					script.push(comm);
				}
			}
		}

		logger.sum("Saving...");
		script.save();
		logger.sum("Done.");
		res.end();

	});
}