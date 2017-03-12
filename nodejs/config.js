var path = require("path");
var baseDir = __dirname;

module.exports = {
	script_dir: path.join(baseDir,"./soundScript/"),
	testcase_dir: path.join(baseDir,"./testcase"),
	sound_dir: path.join(baseDir,"./testcase/sound"),
	rawsound_dir: path.join(baseDir,"./../raw_sound"),
	result_dir: path.join(baseDir,"./result"),
	noise_dir: path.join(baseDir,"./noise"),
	log_file: path.join(baseDir,"./log.txt"),
	knnDB_file: path.join(baseDir,"./ts.bin"),
	soundProcessor: path.join(baseDir,"./../sound-processor.exe"),
	soundMixer: path.join(baseDir,"./../sound-mixer.exe")
};