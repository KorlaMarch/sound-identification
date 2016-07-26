// app/routes.js

var path    = require("path");
var fs = require('fs');
var spawn = require('child_process').spawn;

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
			execFile(path.join(__dirname,"/../../sound-identification.exe"), 
				[inFile,outFile], [], 
			 	function(error, stdout, stderr) {
				console.log("RUN " + stdout);
				if(req.query.file){
					fs.readFile(outFile, 'utf8', function(err, contents) {
		    			if(err){
		    				console.log(err);
		    			}else{
		    				var data = [];
		    				var lines = contents.split("\n");
		    				var lab = [];
		    				var sumX = 0.0,sumY = 0.0;
		    				var scale = parseFloat(lines[0]);
		    				const Resolution = 1;
		    				for(var i = 1; i < lines.length && (i-1)*scale <= 20000; i++){
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
		    				var headName = req.query.file + " FFT Result";
		    				res.render("../views/result.ejs", {"line" : data, "label" : lab, "head" : headName});
		    			}
					});
				}else{
					res.end("Please specify file");
				}
			});
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