var config = require("config.js");
var Log = require("logger.js");
var path = require("path");
var execResult = require("models/execResult.js");
var result = require("models/result.js");

module.exports = function(app){
	var instrument = {
		'P' : 0,
		'G' : 1,
		'V' : 2
	};

	function printTable(matrix,logger){
		var text = "<table>";
		//make header
		text += "<tr> <th>expect\\predict</th> <th>Piano</th> <th>Guitar</th> <th>Violin</th> </tr>";
		//row 1
		text += "<tr> <td>Piano</th> <td>"+matrix[0][0]+"</td> <td>"+matrix[0][1]+"</td> <td>"+matrix[0][2]+"</td> </tr>";
		//row 2
		text += "<tr> <td>Guitar</th> <td>"+matrix[1][0]+"</td> <td>"+matrix[1][1]+"</td> <td>"+matrix[1][2]+"</td> </tr>";
		//row 3
		text += "<tr> <td>Violin</th> <td>"+matrix[2][0]+"</td> <td>"+matrix[2][1]+"</td> <td>"+matrix[2][2]+"</td> </tr>";
		//end table
		text += "</table>";

		logger.log(text,logger.level.sum);

	}

	app.get("/analysis", function(req, res){
		res.render("../views/analysis.ejs",{
			"streamName" : "stream_analysis",
			"heading" : "Script Analysis",
			"resultList" : execResult.prototype.fileList
		} );
	});

	app.get("/stream_analysis", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		var rsfile = new execResult();
		

		rsfile.load(req.query.file, ()=>{
			logger.sum("Show " + rsfile.name);
			rsfile.resultList.forEach( (element)=>{
				var correct=0, ec = 0, all=0;
				var matrix = [
					[0,0,0],
					[0,0,0],
					[0,0,0]];
				logger.warn("Args = " + element.args.slice(2,element.args.length));
				for(var i = 0; i < element.expect.length; i++){
					if(element.predict[i]=='E'){
						ec++;
					}else{
						matrix[instrument[element.expect[i]]][instrument[element.predict[i]]]++;
					}
					all++;
					if(element.expect[i]==element.predict[i]) correct++;
				}
				logger.sum("Error rate " + ec + "/" + all + " (" + (100.0*ec/all).toFixed(2) + "%)");
				logger.warn("Correctness " + correct + "/" + all + " (" + (100.0*correct/all).toFixed(2) + "%)");
				printTable(matrix,logger);
			});
			logger.sum("Done");
			res.end();
		});

	});

	app.get("/join", function(req, res){
		res.render("../views/join.ejs",{
			"streamName" : "stream_join",
			"heading" : "Script Join",
			"resultList" : execResult.prototype.fileList
		} );
	});

	app.get("/stream_join", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		var outfile = new execResult(req.query.file,req.query.file,req.query.file);
		var list = JSON.parse(req.query.list);
		var infile = [];
		logger.sum("File " + req.query.file + " Join : " + list);
		var count = 0;
		list.forEach( (element) => {
			var x = new execResult();
			x.load(element, ()=>{
				count++;
				infile.push(x);
				logger.sum(x.name + " loaded ( " + count + ")");
				if(count==list.length){
					logger.warn("All loaded");
					logger.sum("Merging...");
					for(var j = 0; j < infile[0].resultList.length; j++){
						outfile.push(infile[0].resultList[j]);
						for(var k = 1; k < list.length; k++){
							outfile.resultList[j].expect = outfile.resultList[j].expect.concat(infile[k].resultList[j].expect);
							outfile.resultList[j].predict = outfile.resultList[j].predict.concat(infile[k].resultList[j].predict);
						}
					}
					logger.sum("Saving...");
					outfile.save();
					logger.warn("Done.");
					res.end();
				}
			});
			
		});

	});

	app.get("/sum", function(req, res){
		res.render("../views/analysis.ejs",{
			"streamName" : "stream_sum",
			"heading" : "Super sum",
			"resultList" : execResult.prototype.fileList
		} );
	});

	app.get("/stream_sum", function(req, res){	
		res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
		
		var logger = Log(res);
		var rsfile = new execResult();
		
		var matrix = [
					[0,0,0],
					[0,0,0],
					[0,0,0]];
		var arr = [];
		var sumec = 0;

		rsfile.load(req.query.file, ()=>{
			logger.sum("Show " + rsfile.name);
			rsfile.resultList.forEach( (element)=>{
				var correct=0, ec = 0, all=0;
				
				//logger.warn("Args = " + element.args.slice(2,element.args.length));
				for(var i = 0; i < element.expect.length; i++){
					if(element.predict[i]=='E'){
						ec++;
						sumec++;
					}else{
						matrix[instrument[element.expect[i]]][instrument[element.predict[i]]]++;
					}
					all++;
					if(element.expect[i]==element.predict[i]) correct++;
				}
				arr.push(correct);
			});
			//print table
			var text = "<table>";
			for(var i = 0; i < arr.length; i += 5){
				text += "<tr>";
				for(var j = 0; j < 5; j++){
					text += "<th>" + (100.0*arr[i+j]/300).toFixed(2) + "</th>";
				}
				text += "</tr>";
			}
			text += "</table>";
			logger.log(text,logger.level.sum);
			printTable(matrix,logger);
			logger.sum("EC : " + sumec);
			logger.sum("Done");
			res.end();
		});

	});

}