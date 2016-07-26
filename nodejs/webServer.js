var express  = require('express');
var session  = require('express-session');
var morgan = require('morgan');
var app      = express();
var port     = 8080;

app.use(morgan('dev'));
app.set('view engine', 'ejs');

app.use(session({
	secret: 'vuj44gfs2vcew7',
	resave: true,
	saveUninitialized: false
 } ));

require('./app/routes.js')(app); 

app.listen(port);
console.log('Server start on port ' + port);
