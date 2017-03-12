var command = require("models/command.js");
var commandType = command.prototype.commandType;

function result(type, file, args){
	this.type = type;
	this.args = args;
	this.file = file;
	if(type==commandType.Run){
		this.expect = "";
		this.predict = "";
	}else{
		this.expect = [];
		this.predict = [];
	}
};

module.exports = result;