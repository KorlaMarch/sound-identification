var fs = require("fs");
var path = require("path");
var config = require("config.js");
var logger = require("logger.js")();

module.exports = function testcase(name, id, file){

	this.name = name;
	this.id = id;
	this.file = file;
	this.train = [];
	this.test = [];

	this.loadMaster = function(){
		if(!testcase.prototype.fileList){
			try{
				var data = fs.readFileSync(path.join(config.testcase_dir,"master.json"));
				testcase.prototype.fileList = JSON.parse(data);
			}catch(err){
				//create new fileList
				testcase.prototype.fileList = [];
				logger.error(err);
			}
		}
	};

	this.saveMaster = function(){
		if(testcase.prototype.fileList){
			try{
				fs.writeFileSync(path.join(config.testcase_dir,"master.json"), JSON.stringify(testcase.prototype.fileList));
			}catch(err){
				logger.error(err);
			}
		}
	};

	this.getFileList = function(){
		if(testcase.prototype.fileList){
			return testcase.prototype.fileList;
		}else throw "No file list was found.";
	};

	this.load = function(file, callback){
		fs.readFile(path.join(config.testcase_dir,file), (err, data) => {
			if(err) callback(err);
			Object.assign(this,JSON.parse(data));
			callback();
		});
	};

	this.save = function(callback){
		testcase.prototype.fileList.push({
			name : this.name,
			id : this.id,
			file : this.file
		});
		fs.writeFile(path.join(config.testcase_dir,this.file), JSON.stringify(this), callback);
	};

};
