// app/routes.js

module.exports = function(app) {
	app.get('/',

	);
	app.post('/login',
        function(req, res) {
			connection.query("SELECT * FROM ?? WHERE username = ?",[dbconfig.users_table,req.body.username],
				function(err, rows){
					if (err){
						var resdata = resconfig.login.query_error;
						resdata.data = err;
						return res.json(resdata);
					}else if (!rows.length) {
						return res.json(resconfig.login.nouser);
					}
					// if the user is found but the password is wrong
					if (!bcrypt.compareSync(req.body.password, rows[0].password)){
						return res.json(resconfig.login.wrong_pass);
					}
					// all is well, set the session and return user
					req.session.userID = rows[0].id;
					req.session.username = rows[0].username;
					req.session.isAuthenticated = true;
					var resdata = resconfig.login.ok;
					resdata.data = rows[0];
					delete resdata.data.password;
					return res.json(resdata);
				}
			);
		}
	);

	app.post('/signup',
		function(req, res){
			connection.query("SELECT * FROM ?? WHERE username = ?",[dbconfig.users_table,req.body.username], function(err, rows) {
                if (err){
					var resdata = resconfig.signup.query_error;
					resdata.data = err;
                    return res.json(resdata);
                }else if (rows.length) {
                    return res.json(resconfig.signup.userInDB);
                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = {
                        username: req.body.username,
                        password: bcrypt.hashSync(req.body.password, null, null)  // use the generateHash function in our user model
                    };

                    connection.query("INSERT INTO ?? ( username, password ) values (?,?)",[dbconfig.users_table, newUserMysql.username, newUserMysql.password],function(err, rows) {
                        newUserMysql.id = rows.insertId;
						var resdata = resconfig.signup.ok;
						resdata.data = rows;
						return res.json(resdata);
                    });
                }
            });
		}
	);

	app.get('/load', isLoggedIn, function(req, res) {
		connection.query("SELECT * FROM ?? WHERE userid = ?",[dbconfig.storage_table,req.session.userID],
			function(err, rows){
				console.log(JSON.stringify(rows));
				if(err){
					var resdata = resconfig.load.query_error;
					resdata.data = err;
          return res.json(resdata);
				}else if(rows.length==0){
					return res.json(resconfig.load.empty);
				} else {
					//everything is correct, so return
					var resdata = resconfig.load.ok;
					resdata.data = rows;
					return res.json(resdata);
				}
			}
		);
	});

	app.post('/save', isLoggedIn, function(req, res) {
		connection.query("INSERT INTO ?? (userid, title, content) VALUES (?, ?, ?)",[dbconfig.storage_table, req.session.userID, req.body.title, JSON.stringify(req.body.content)],
			function(err, rows) {
				if(err){
					var resdata = resconfig.save.query_error;
					resdata.data = err;
					return res.json(resdata);
				}
				return res.json(resconfig.save.ok);
			}
		);
	});

	app.get('/logout', function(req, res) {
		req.session.destroy(
			function(){
				return res.json(resconfig.logout.ok);
			}
		);
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.session.isAuthenticated){
		return next();
	}
	return res.json(resconfig.invaild_session);
}

function destroySession(req,res,next){
	req.session.destroy(
		function(){
			return next();
		}
	);
}
