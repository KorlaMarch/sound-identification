var config = require("config.js");
var chalk = require("chalk");
var ansiHTML = require("ansi-html");
var stripAnsi = require("strip-ansi");
var fs = require("fs");

module.exports = function(logstream){
	var module = {};

	var Level = {
		error : 0,
		warn : 1,
		sum : 2,
		info : 3,
		debug : 4
	};

	var Color = {
		error : chalk.red.bold,
		warn : chalk.yellow,
		sum : chalk.white,
		info : chalk.cyan,
		debug : chalk.dim
	};

	function writeFile(text){
		if(!this.file){
			this.file = fs.openSync(config.log_file,'w');
		}
		fs.write(this.file,stripAnsi(text+"\n"),'utf8');
	}

	function writeStream(text, event){
		if(logstream){
			var massage = text.split("\n");
			for(var i = 0; i < massage.length; i++){
				if(event) logstream.write("event: " + event + "\n");
				logstream.write("data: " + ansiHTML(massage[i]) + "<br />" + "\n\n");
			}
		}
	}

	function writeConsole(text){
		console.log(text);
	}

	module.log = function(text, lev){
		switch(lev){
			case Level.error :
			case Level.warn :
			case Level.sum :
				writeStream(text,"summary");
			case Level.info :
				writeStream(text,"info");
				writeFile(text);
			case Level.debug :
				writeConsole(text);
		}
	}

	module.error = function(text){
		module.log(Color.error(text),Level.error);
	};

	module.warn = function(text){
		module.log(Color.warn(text),Level.warn);
	};

	module.sum = function(text){
		module.log(Color.sum(text),Level.sum);
	};

	module.info = function(text){
		module.log(Color.info(text),Level.info);
	};

	module.debug = function(text){
		module.log(Color.debug(text),Level.debug);
	};

	module.level = Level;

	return module;
}

