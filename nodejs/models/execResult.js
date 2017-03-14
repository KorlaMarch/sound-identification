var fs = require("fs");
var path = require("path");
var config = require("config.js");
var command = require("models/command.js");
var logger = require("logger.js")();
var result = require("models/result.js");

module.exports = function execResult(name, id, file){

	this.name = name;
	this.id = id;
	this.file = file;
	this.resultList = [];

	this.loadMaster = function(){
		if(!execResult.prototype.fileList){
			try{
				var data = fs.readFileSync(path.join(config.result_dir,"master.json"));
				execResult.prototype.fileList = JSON.parse(data);
			}catch(err){
				//create new fileList
				execResult.prototype.fileList = [];
				logger.error(err);
			}
		}
	};

	this.saveMaster = function(){
		if(execResult.prototype.fileList){
			try{
				fs.writeFileSync(path.join(config.result_dir,"master.json"), JSON.stringify(execResult.prototype.fileList));
			}catch(err){
				logger.error(err);
			}
		}
	};

	this.getFileList = function(){
		if(execResult.prototype.fileList){
			return execResult.prototype.fileList;
		}else throw "No file list was found.";
	};

	this.load = function(file, callback){
		fs.readFile(path.join(config.result_dir,file), (err, data) => {
			if(err) callback(err);
			Object.assign(this,JSON.parse(data));
			callback();
		});
	};

	this.save = function(callback){
		execResult.prototype.fileList.push({
			name : this.name,
			id : this.id,
			file : this.file
		});
		fs.writeFile(path.join(config.result_dir,this.file), JSON.stringify(this), callback);
	};

	this.push = function(res){
		this.resultList.push(res);
	};

};