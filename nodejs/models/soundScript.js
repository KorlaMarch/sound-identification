var fs = require("fs");
var path = require("path");
var config = require("config.js");
var command = require("models/command.js");
var logger = require("logger.js")();

module.exports = function soundScript(name, id, file){

	this.name = name;
	this.id = id;
	this.file = file;
	this.instruction = [];

	this.loadMaster = function(){
		if(!soundScript.prototype.fileList){
			try{
				var data = fs.readFileSync(path.join(config.script_dir,"master.json"));
				soundScript.prototype.fileList = JSON.parse(data);
			}catch(err){
				//create new fileList
				soundScript.prototype.fileList = [];
				logger.error(err);
			}
		}
	};

	this.saveMaster = function(){
		if(soundScript.prototype.fileList){
			try{
				fs.writeFileSync(path.join(config.script_dir,"master.json"), JSON.stringify(soundScript.prototype.fileList));
			}catch(err){
				logger.error(err);
			}
		}
	};

	this.getFileList = function(){
		if(soundScript.prototype.fileList){
			return soundScript.prototype.fileList;
		}else throw "No file list was found.";
	};

	this.load = function(file, callback){
		fs.readFile(path.join(config.script_dir,file), (err, data) => {
			if(err) callback(err);
			Object.assign(this,JSON.parse(data));
			callback();
		});
	};

	this.save = function(callback){
		soundScript.prototype.fileList.push({
			name : this.name,
			id : this.id,
			file : this.file
		});
		fs.writeFile(path.join(config.script_dir,this.file), JSON.stringify(this), callback);
	};

	this.push = function(com){
		if(com instanceof command){
			this.instruction.push(com);
		}else{
			logger.error("addCommand called with non-command parameter.");
		}
	};

};
