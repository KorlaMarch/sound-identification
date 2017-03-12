command.prototype.commandType = {
	Clear: 0,
	Run: 1,
	GroundRun: 2,
	MixSound: 3
};

function command(type,isTest){
	this.type = type;
	if(isTest) this.isTest = true;
	else this.isTest = false;

	if(type==command.prototype.commandType.Clear){

	}else if(type==command.prototype.commandType.Run){
		this.file = "";
		this.expect = "";
		this.args = [];
	}else if(type==command.prototype.commandType.GroupRun){
		this.file = "";
		this.args = [];
	}else if(type==command.prototype.commandType.MixSound){
		this.fileA = "";
		this.fileB = "";
		this.factor = 0.5;
		this.fileOut = "";
	}
	
};

module.exports = command;