// app/routes.js

var path    = require("path");
var fs = require('fs');

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

module.exports = function(app) {
	app.get('/',
		function(req, res){
			// render index
			res.render("../views/index.ejs");
		}
	);
	app.get('/result',
		function(req, res){
			
			var execFile = require('child_process').execFile;
			const inFile = path.join(__dirname,"/../../sample/" + req.query.file + ".wav");
			const outFile = path.join(__dirname,"/../../output/" + req.query.file + ".csv");
			console.log("EXEC " + inFile + " " + outFile);
			execFile(path.join(__dirname,"/../../sound-identification.exe"), 
				[inFile,outFile], [], 
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

	app.get('/addTS',
		function(req, res){
			var execFile;
			var inFile;
			var outFile;

			for(var i = 1; i <= 15; i++){
				execFile = require('child_process').execFileSync;
				inFile = path.join(__dirname,"/../../sample/" + req.query.file + i + ".wav");
				outFile = path.join(__dirname,"/../../output/" + req.query.file + i + ".csv");
				console.log("ADD " + inFile);
				var stdout = execFile(path.join(__dirname,"/../../sound-identification.exe"), 
					[inFile,outFile,"-a",req.query.mtype,"-ld"], [] );
				console.log("OUT : \n" + stdout);
			}
			resfile(res,outFile, req.query.file + 15);
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