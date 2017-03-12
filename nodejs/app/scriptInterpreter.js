var soundScript = require("models/soundScript.js");
var execResult = require("models/execResult.js");
var Result = require("models/result.js");
var command = require("models/command.js");
var testcase = require("models/testcase.js");
var sound = require("models/sound.js");

var commandType = command.prototype.commandType;
var config = require("config.js");
var child_process = require("child_process");
var fs = require("fs");
var path = require("path");

module.exports = function(logger){
	var module = {};

	module.clear = clear;
	module.run = run;
	module.groupRun = groupRun;
	module.mix = mix;
	module.exec = exec;
	module.runScript = runScript;

	function clear(callback){
		fs.access(config.knnDB_file, (err)=>{
			if(err){
				logger.warn("No old ts.bin was found");
				callback();
			}else{
				logger.info("Remove old ts.bin");
				fs.unlink(config.knnDB_file,callback);
			}
		});
	}

	function run(com,callback){
		logger.info("Run " + com.file + " with args : " + com.args.slice(2,com.args.length));
		child_process.execFile(config.soundProcessor,[path.join(config.sound_dir,com.file)].concat(com.args), 
		(err, stdout, stderr) => {
			if(err) logger.error(err);
			logger.info("Get " + stdout);
			var res = new Result(commandType.Run,com.file,com.args);
			res.expect = com.expect;
			stdout = stdout.split("\n");
			res.predict = stdout[stdout.length-1];
			callback(res);
		});
	}

	function groupRun(com,callback){
		//load testcase
		var group = new testcase();
		group.load(com.file, ()=>{
			//make new script
			var newscript = new soundScript();
			newscript.push(new command(commandType.Clear,false));
			//add train
			group.train.forEach( (element) => {
				var x = new command(commandType.Run,false);
				x.file = element.file;
				x.args = com.args.concat(["-t",element.type]);
				x.expect = element.type;
				newscript.push(x);
			});

			//add test
			group.test.forEach( (element) => {
				var x = new command(commandType.Run,true);
				x.file = element.file;
				x.args = com.args;
				x.expect = element.type;
				newscript.push(x);
			});

			runScript(newscript, (res)=>{
				logger.sum("Finish Group Run of " + com.args.slice(2,com.args.length));
				logger.sum("Compare Result...");
				var correct=0, all=0;
				var newres = new Result(commandType.GroupRun,com.file,com.args);
				for(var i = 0; i < res.resultList.length; i++,all++){
					newres.expect.push(res.resultList[i].expect);
					newres.predict.push(res.resultList[i].predict);
					logger.info("expect : " + res.resultList[i].expect + " predict : " + res.resultList[i].predict);
					if(res.resultList[i].expect==res.resultList[i].predict){
						correct++;
					}
				}
				logger.warn("Correctness " + correct + "/" + all + " (" + (100.0*correct/all).toFixed(2) + ")");
				callback(newres);
			});
		});
	}

	function mix(com,callback){
		logger.sum("mix " + path.basename(com.fileA) + " , " + path.basename(com.fileB)
			+ " => " + path.basename(com.fileOut) + " -p " + com.factor.toString());
		child_process.execFile(config.soundMixer,[com.fileA,com.fileB,com.fileOut,"-p",com.factor.toString()], 
			(err, stdout, stderr) => {
				console.log(callback);
				if(err) logger.error(err);
				callback(stdout);
			});
	}

	function exec(com,callback){
		if(com){
			logger.info("EXEC " + JSON.stringify(com));
			logger.debug("TYPE " + JSON.stringify(commandType));
			if(com.type==commandType.Clear){
				clear(callback);
			}else if(com.type==commandType.Run){
				run(com,callback);
			}else if(com.type==commandType.GroupRun){
				groupRun(com,callback);
			}else if(com.type==commandType.MixSound){
				mix(com,callback);
			}
		}else throw "Invalid command provided to exec()";
	}

	function runScript(script, callback){
		var result = new execResult(script.name,script.id,script.file);
		var inst = script.instruction;
		execNext(0);
		function execNext(x){
			if(x>=inst.length){
				//end of instruction
				callback(result);
			}else{
				logger.info("execute " + x);
				exec(inst[x], (res) => {

					if(inst[x].isTest){
						logger.info("Add result to list");
						result.push(res);
					}
					execNext(x+1);
				});
			}
		}

	}

	return module;
};