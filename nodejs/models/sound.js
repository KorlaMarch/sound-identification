var fs = require("fs");
var path = require("path");
var config = require("config.js");
var logger = require("logger.js")();

module.exports = function sound(name, id, file, type, noise){

	this.name = name;
	this.id = id;
	this.file = file;
	this.type = type;
	this.noise = noise;

	this.loadMaster = function(){
		if(!sound.prototype.fileList){
			try{
				var data = fs.readFileSync(path.join(config.sound_dir,"master.json"));
				sound.prototype.fileList = JSON.parse(data);
			}catch(err){
				//create new fileList
				sound.prototype.fileList = [];
				logger.error(err);
			}
		}
	};

	this.saveMaster = function(){
		if(sound.prototype.fileList){
			console.log("Save : " + sound.prototype.fileList.length);
			try{
				fs.writeFileSync(path.join(config.sound_dir,"master.json"), JSON.stringify(sound.prototype.fileList));
			}catch(err){
				logger.error(err);
			}
		}
	};

	this.getFileList = function(){
		if(sound.prototype.fileList){
			return sound.prototype.fileList;
		}else throw "No file list was found.";
	};

	this.load = function(file){
		var x = sound.prototype.fileList.find((element)=>{
			return element.file==file;
		});
		Object.assign(this,x);
	};

	this.save = function(){
		console.log("push " + this);
		sound.prototype.fileList.push(this);
	};

};
