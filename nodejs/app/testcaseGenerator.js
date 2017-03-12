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
	var noiseList;	

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function shuffleArray(array) {
	    for (var i = array.length - 1; i > 0; i--) {
	        var j = Math.floor(Math.random() * (i + 1));
	        var temp = array[i];
	        array[i] = array[j];
	        array[j] = temp;
	    }
	    return array;
	}

	function getRandomNoise(){
		if(!noiseList){
			noiseList = fs.readdirSync(path.join(config.rawsound_dir,"./noise"));
		}
		return path.join(config.rawsound_dir,"./noise",noiseList[getRandomInt(0,noiseList.length-1)]);

	}

	function getRandomSound(type,noise,n){
		console.log("GET random sound " + type + " : " + noise + " : " + n);
		var filtered = sound.prototype.fileList.filter((element) => {
			return element.noise==noise&&element.type==type;
		});
		return shuffleArray(filtered).slice(0,n);
	}

	function specialRandomSound(type,train_noise,test_noise,train_size,test_size){
		console.log("GET random sound " + type + " : " + train_noise + " " + test_noise + " " + train_size + " " + test_size );
		var n = train_size + test_size;
		var num = [];
		for(var i = 1; i <= n; i++){
			num.push(i);
		}

		shuffleArray(num);

		var trainMP = {};
		var testMP = {};

		sound.prototype.fileList.forEach((element) => {
			if(element.noise==train_noise&&element.type==type){
				trainMP[parseInt(element.file.split("-")[1])] = element;
			}
		});

		sound.prototype.fileList.forEach((element) => {
			if(element.noise==test_noise&&element.type==type){
				testMP[parseInt(element.file.split("-")[1])] = element;
			}
		});

		var out = [];
		for(var i = 0; i < train_size; i++){
			out.push(trainMP[num[i]]);
		}
		for(var i = train_size; i < n; i++){
			out.push(testMP[num[i]]);
		}

		return out;
	}

	app.get("/mixsound",
		function(req, res){
			res.render("../views/streamGen.ejs", { "streamName" : "stream_mixsound" , "heading" : "Sound Mixing"} );
		}
	);

	app.get("/stream_mixsound",
		function(req, res){	
			res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});

			var logger = Log(res);
			var interpreter = scriptInterpreter(logger);

			logger.sum("Generate sound with noise factor : " + req.query.noise);
			var factor = parseFloat(req.query.noise);
			var postfix = "-N"+(factor*100).toFixed(0);
			logger.info("Postfix is " + postfix);
			//make new sound script
			var script = new soundScript();
			//piano mix with noise
			var i = 0;
			var comm,outsound;
			for(i = 1; i <= 50; i++){
				comm = new command(command.prototype.commandType.MixSound,false);
				comm.fileA = getRandomNoise();
				comm.fileB = path.join(config.rawsound_dir,"./piano","piano-"+i+".wav");
				comm.fileOut = path.join(config.sound_dir,"piano-"+i+postfix+".wav");
				comm.factor = factor;
				script.push(comm);

				outsound = new sound("Piano sound with " + postfix,"piano-"+i+postfix,path.basename(comm.fileOut),"P",factor);
				outsound.save();
			}
			//violin mix with noise
			for(i = 1; i <= 50; i++){
				comm = new command(command.prototype.commandType.MixSound,false);
				comm.fileA = getRandomNoise();
				comm.fileB = path.join(config.rawsound_dir,"./violin","violin-"+i+".wav");
				comm.fileOut = path.join(config.sound_dir,"violin-"+i+postfix+".wav");
				comm.factor = factor;
				script.push(comm);

				outsound = new sound("Violin sound with " + postfix,"violin-"+i+postfix,path.basename(comm.fileOut),"V",factor);
				outsound.save();
			}
			//guitar mix with noise
			for(i = 1; i <= 50; i++){
				comm = new command(command.prototype.commandType.MixSound,false);
				comm.fileA = getRandomNoise();
				comm.fileB = path.join(config.rawsound_dir,"./guitar","guitar-"+i+".wav");
				comm.fileOut = path.join(config.sound_dir,"guitar-"+i+postfix+".wav");
				comm.factor = factor;
				script.push(comm);

				outsound = new sound("Guitar sound with " + postfix,"guitar-"+i+postfix,path.basename(comm.fileOut),"G",factor);
				outsound.save();
			}

			interpreter.runScript(script, (result)=>{
				res.end();
			});

			
		}
	);

	app.get("/testcase",
		function(req, res){
			res.render("../views/testcase.ejs", { "streamName" : "stream_testcase" , "heading" : "Testcase Generator"} );
		}
	);

	app.get("/stream_testcase",
		function(req, res){	
			res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});

			var logger = Log(res);
			logger.sum("Generate testcase with " + JSON.stringify(req.query));
			var query = req.query;
			
			query.train_size  = parseInt(query.train_size);
			query.train_noise = parseFloat(query.train_noise);
			query.test_size   = parseInt(query.test_size);
			query.test_noise  = parseFloat(query.test_noise);
			
			var tc = new testcase(query.testfile,query.testfile,query.testfile);

			logger.sum("Generate train&test");
			var p = specialRandomSound('P',query.train_noise,query.test_noise,query.train_size,query.test_size);
			var v = specialRandomSound('V',query.train_noise,query.test_noise,query.train_size,query.test_size);
			var g = specialRandomSound('G',query.train_noise,query.test_noise,query.train_size,query.test_size);

			tc.train = tc.train.concat(p.slice(0,query.train_size));
			tc.train = tc.train.concat(v.slice(0,query.train_size));
			tc.train = tc.train.concat(g.slice(0,query.train_size));

			tc.test = tc.test.concat(p.slice(query.train_size,query.train_size+query.test_size));
			tc.test = tc.test.concat(v.slice(query.train_size,query.train_size+query.test_size));
			tc.test = tc.test.concat(g.slice(query.train_size,query.train_size+query.test_size));

			logger.sum("Train:");
			for(var i = 0; i < tc.train.length; i++){
				logger.sum(tc.train[i].id);
			}
			logger.sum("Test:");
			for(var i = 0; i < tc.test.length; i++){
				logger.sum(tc.test[i].id);
			}

			logger.sum("Done");
			logger.sum("Saving file");
			tc.save( (err)=> {
				if(err){
					logger.error("Error : " + err);
				}else logger.sum("Saving successful");
				res.end();
			});
		}
	);
};