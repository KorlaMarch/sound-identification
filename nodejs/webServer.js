"use strict";

var modulePath = require('app-module-path');
modulePath.addPath(__dirname);
modulePath.addPath(require('path').join(__dirname,'./app/'));

var express  = require("express");
var session  = require("express-session");
var morgan = require("morgan");
var app      = express();
var port     = 8080;
var on_death = require("death");

//load database
var soundScript = new require("models/soundScript.js");
var script = new soundScript();
script.loadMaster();
var execResult = new require("models/execResult.js");
var exresult = new execResult();
exresult.loadMaster();
var soundModel = require("models/sound.js");
var sound = new soundModel();
sound.loadMaster();
var Test = require("models/testcase.js");
var testcase = new Test();
testcase.loadMaster();

app.use(morgan("dev"));
app.set("view engine", "ejs");

app.use(session({
	secret: "vuj44gfs2vcew7",
	resave: true,
	saveUninitialized: false
} ));

app.use(function(req, res, next) {
  req.headers['if-none-match'] = 'no-match-for-this';
  next();    
});

require("routes.js")(app); 
require("testcaseGenerator.js")(app);
require("scriptGenerator.js")(app);
require("interpreterPage.js")(app);
require("resultAnalysis.js")(app);

app.listen(port);
console.log("Server start on port " + port);

var off_death = on_death(function(signal, err) {
	console.log("Save all master file.");
	script.saveMaster();
	exresult.saveMaster();
	sound.saveMaster();
	testcase.saveMaster();
	console.log("Save finish");
	off_death();
	process.exit(0);
});