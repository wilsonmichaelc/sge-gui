var express				= require('express');
var session  			= require('express-session');
var passport 			= require('passport');
var cookieParser 	= require('cookie-parser');
var bodyParser 		= require('body-parser');
var flash    			= require('connect-flash');
var Strategy 			= require('passport-local').Strategy;
var pam	 					= require('authenticate-pam');
var app     			= express();
var port     			= 8080;


app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.set('view engine', 'ejs');
app.use(session({
	secret: 'YOURSECRETGOESHERE',
	resave: true,
	saveUninitialized: true
 } ));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static('public'));

// =====================================
// CUSTOM PASSPORT STRATEGY=============
// =====================================
passport.use('pam', new Strategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'username',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
  function(req, username, password, done) {
		pam.authenticate(username, password, function(err) {
	    if(err) {
				done(null, false, req.flash('loginMessage', 'Oops! Wrong usrename or password.'));
	    }else{
				done(null, username);
			}
		});
  })
);

// =====================================
// PASSPORT SERIALIZE ==================
// =====================================
passport.serializeUser(function(username, done) {
		done(null, username);
});

// used to deserialize the user
passport.deserializeUser(function(username, done) {
		done(null, username);
});

// =====================================
// LOGIN ===============================
// =====================================
app.get('/login', function(req, res) {
	// render the page and pass in any flash data if it exists
	res.render('login.ejs', { message: req.flash('loginMessage') });
});

app.post('/login',
  passport.authenticate('pam', {
		failureRedirect: '/login',
		successRedirect: '/home',
		failureFlash: true
	}),
  function(req, res) {
		if (req.body.remember){
			req.session.cookie.maxAge = 1000 * 60 * 3;
		} else {
			req.session.cookie.expires = false;
		}
    res.redirect('/');
  }
);

// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

// =====================================
// INDEX PAGE ==========================
// =====================================
app.get('/', function(req, res) {
	res.render('index.ejs'); // load the index.ejs file
});

// =====================================
// HOME PAGE ===========================
// =====================================
app.get('/home', isLoggedIn, function(req, res) {
	res.render('home.ejs', {
		user : req.username, // get the user out of session and pass to template
		page : 'home'
	});
});

// =====================================
// ROUTE MIDDLEWARE ====================
// =====================================
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);