// app/routes.js

var path    = require("path");
var fs = require('fs');
var chalk = require('chalk');
var child_process = require('child_process');
var ansiHTML = require('ansi-html');
const logError = chalk.red.bold;
const infoH = chalk.green;
const infoC = chalk.cyan;
const logPass = chalk.green.bold;
const logFail = chalk.red.bold;
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');

function logstream(res, massage, event){
	console.log(massage);
	var massageA = massage.split("\n");
	for(var i = 0; i < massageA.length; i++){
		if(event) res.write("event: " + event + "\n");
		res.write("data: " + ansiHTML(massageA[i]) + "<br />" + "\n\n");
	}

}

function addTSList(file, mtype, res, parameter){
	var execFile,inFile,outFile;

	for(var i = 1; i <= 15; i++){
		inFile = path.join(__dirname,"/../../sample/" + file + i + ".wav");
		outFile = path.join(__dirname,"/../../output/" + file + i + ".csv");
		logstream(res,"ADD " + file + i + ".wav");
		try{
			var stdout = child_process.execFileSync(path.join(__dirname,"/../../sound-processor.exe"), 
				[inFile,"-f","ts.bin","-t",mtype].concat(parameter), [] );
			if(Buffer.isBuffer(stdout) ){
				stdout = decoder.write(stdout);
			}
			//logstream(res,stdout);
		}catch(e){
			logstream(res,logError("Error at " + file + i + ".wav" + " (return signal : " + e.status + ")" ) );
			if(Buffer.isBuffer(e.stdout) ){
				logstream(res,logError("Output : \n") + infoC(decoder.write(e.stdout) ) );
			}else{
				logstream(res,logError("Output : \n") + infoC(e.stdout) );
			}
			
		}
	}
}

function testList(file, mtype, res, testResult, parameter){
	var execFile,inFile,outFile;

	for(var i = 16; i <= 30; i++){
		inFile = path.join(__dirname,"/../../sample/" + file + i + ".wav");
		outFile = path.join(__dirname,"/../../output/" + file + i + ".csv");
		logstream(res,"Test " + file + i + ".wav");
		try{
			var stdout = child_process.execFileSync(path.join(__dirname,"/../../sound-processor.exe"), 
				[inFile,"-f","ts.bin"].concat(parameter), [] );
			if(Buffer.isBuffer(stdout) ){
				//encoding stdout
				stdout = decoder.write(stdout);
			}
			//logstream(res,stdout);
			stdout = stdout.split("\n");
			var predictType = stdout[stdout.length-1];
			testResult.simpleSize++;
			if(mtype==predictType){
				testResult.pass++;
				logstream(res,logPass("Expect: " + mtype + " Get: " + predictType));
			}else{
				logstream(res,logFail("Expect: " + mtype + " Get: " + predictType));
			}

		}catch(e){
			logstream(res,logError("Error at " + file + i + ".wav" + " (return signal : " + e.status + ")" ) );
			logstream(res,"Massage : " + e);
			if(Buffer.isBuffer(e.stdout) ){
				logstream(res,logError("Output : \n") + infoC(decoder.write(e.stdout) ) );
			}else{
				logstream(res,logError("Output : \n") + infoC(e.stdout) );
			}
			
		}
	}
}

function resfile(res, outFile, fileName){
	fs.readFile(outFile, 'utf8', function(err, contents) {
	if(err){
		console.log(err);
	}else{
		var data = [];
		var lines = contents.split("\n");
		var lab = [];
		var sumX = 0.0,sumY = 0.0;
		var type = lines[0];
		var scale = parseFloat(lines[1]);
		var size = parseInt(lines[2]);

		const Resolution = 2;
		for(var i = 3; i < lines.length && (i-1)*scale <= 20000; i++){
			//data.push({'x' : parseFloat(pos[0]), 'y' : parseFloat(pos[1])});
			sumX += parseFloat((i-1)*scale);
			sumY += parseFloat(lines[i]);
			if(i%Resolution==0){
				if(sumX/Resolution>=20){
					data.push({'x' : sumX/Resolution, 'y' : sumY/Resolution});
					lab.push(sumY/Resolution);
				}
				sumX = 0.0;
				sumY = 0.0;
			}
		}
		//console.log(data);
		var headName = fileName + " FFT Result";
		res.render("../views/result.ejs", {"line" : data, "label" : lab, "head" : headName, "musictype": type});
	}
	});
}

function streamGen(res, config){
	logstream(res,infoH("Initiate generating sequence..."));

	var tsFile = path.join(__dirname,"/../ts.bin");
	try{
		fs.accessSync(tsFile);
		logstream(res,infoH("Remove old ts.bin"));
		fs.unlinkSync(tsFile);
	}catch(e) {
		logstream(res,logError("No old ts.bin was found"));
	}

	logstream(res,infoH("Adding Piano"));
	addTSList("Piano/piano-","P",res,config);
	
	logstream(res,infoH("Adding Guitar"));
	addTSList("Guitar/Guitar-","G",res,config);

	logstream(res,infoH("Adding Violin"));
	addTSList("Violin/violin-","V",res,config);

	logstream(res,infoH("End of generating sequence"));
}

function streamTest(res, config){
	var testResult = {simpleSize: 0, pass: 0};
	testResult.toString = function(){
		return logFail("All: " + testResult.simpleSize) + logPass(" Pass: " + testResult.pass) 
		+ " Accuracy: " + (testResult.pass/testResult.simpleSize*100).toFixed(3) + "%";
	};

	logstream(res,infoH("Initiate self-testing sequence..."));

	logstream(res,infoH("Testing Piano"));
	testList("Piano/piano-","P",res,testResult,config);
	logstream(res,"Current result " + testResult.toString() );

	logstream(res,infoH("Testing Guitar"));
	testList("Guitar/Guitar-","G",res,testResult,config);
	logstream(res,"Current result " + testResult.toString() );

	logstream(res,infoH("Testing Violin"));
	testList("Violin/violin-","V",res,testResult,config);
	logstream(res,"Result " + testResult.toString() );

	logstream(res,infoH("End of self-testing sequence"));

	return testResult;
}

module.exports = function(app) {
	app.get('/',
		function(req, res){
			// render index
			res.render("../views/index.ejs");
		}
	);
	
	app.get('/result',
		function(req, res){
			
			const inFile = path.join(__dirname,"/../../sample/" + req.query.file + ".wav");
			const outFile = path.join(__dirname,"/../../output/" + req.query.file + ".csv");
			console.log("EXEC " + inFile + " " + outFile);
			child_process.execFile(path.join(__dirname,"/../../sound-processor.exe"), 
				[inFile,"-f","ts.bin","-e",outFile], [], 
				function(error, stdout, stderr) {
					if(stdout) console.log("RUN\n" + stdout);
					if(stderr) console.log("ERR\n" + stderr);
					if(error) console.log("error\n" + JSON.stringify(error) );
					else if(req.query.file){
						resfile(res,outFile,req.query.file);
					}else{
						res.end("Please specify file");
					}
			});
		}
	);

	app.get('/gentest',
		function(req, res){
			res.render("../views/stream.ejs", { "streamName" : "stream_gen", "heading" : "Generate Testset"} );
		}
	);

	app.get('/stream_gen', 
		function(req, res){
			res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
			streamGen(res);
			res.end();
		}
	);

	app.get('/selftest',
		function(req, res){
			res.render("../views/stream.ejs", { "streamName" : "stream_selftest" , "heading" : "Self testing"} );
		}
	);

	app.get('/stream_selftest',
		function(req, res){

			res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});

			streamTest(res);

			res.end();
		}
	);

	app.get('/fulltest',
		function(req, res){
			res.render("../views/streamFull.ejs", { "streamName" : "stream_fulltest" , "heading" : "Full testing"} );
		}
	);

	app.get('/stream_fulltest',
		function(req, res){
			var testResult = {simpleSize: 0, pass: 0};
			var windows = ['R','T','H','M','B','F'];
			var distance = ['E','M'];
			var kcon = [1,2,3,4,5];

			res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});

			for(var i = 0; i < windows.length; i++){
				streamGen(res,["-w",windows[i]]);
				for(var j = 0; j < distance.length; j++){
					for(var k = 0; k < kcon.length; k++){
						var para = ["-w",windows[i],"-d",distance[j],"-k",kcon[k].toString()];
						var result = streamTest(res,para);

						logstream(res,"Result of windows: " + logPass(windows[i]) + 
							" distance: " + logPass(distance[j]) +
							" kcon: " + logPass(kcon[k].toString()),"result");
						logstream(res,result.toString(),"result");
					}
				}
			}

			res.end();
		}
	);

	app.get('/js/Chart.bundle.min.js',
		function(req, res){
			res.sendFile(path.join(__dirname,"/../js/Chart.bundle.min.js"));
		}
	);
	app.get('/js/jquery-3.1.0.min.js',
		function(req, res){
			res.sendFile(path.join(__dirname,"/../js/jquery-3.1.0.min.js"));
		}
	);
	app.get('js/Chart.Scatter.min.js',
		function(req, res){
			res.sendFile(path.join(__dirname,"/../js/Chart.Scatter.min.js"));
		}
	);
};