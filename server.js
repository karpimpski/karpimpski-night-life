var express = require('express');
var app = express();
var request = require('request');
var oauthSignature = require('oauth-signature');  
var n = require('nonce')();  
var qs = require('querystring');  
var _ = require('lodash');
var mongoose = require('mongoose');
var path = require('path');

mongoose.connect(process.env.DB_URI);
const Location = require('./models/location');
const User = require('./models/user');

var passport = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;
passport.use(new TwitterStrategy({
    consumerKey: process.env.twitter_consumer_key,
    consumerSecret: process.env.twitter_consumer_secret,
    callbackURL: "/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    User.findById(profile.id, function(err, user){
      if(err) throw err;
      if(!user){
        let newUser = new User({
          _id: profile.id,
          going: []
        });
        newUser.save(function(err){
          if(err) console.log(err);
          return done(err, newUser);
        });
      }
      else{
        return done(err, user);
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MemoryStore = require('session-memory-store')(session);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    cookieName: 'session',
    secret: 'aglhsha;asgq351021hgadlbvagq723ntaskg1',
    resave: true,
    saveUninitialized: true,
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    store: new MemoryStore()
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('client/public'));

app.get('/api/venues/:location', function(req, res){
  const httpMethod = "GET";
  const url = 'http://api.yelp.com/v2/search';
  let parameters = {
    location: req.params.location,
    term: 'bars',
    oauth_consumer_key : process.env.oauth_consumer_key,
    oauth_token : process.env.oauth_token,
    oauth_nonce : n(),
    oauth_timestamp : n().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };
  const signature = oauthSignature.generate(httpMethod, url, parameters, process.env.consumer_secret, process.env.token_secret, { encodeSignature: false});
  parameters.oauth_signature = signature;
  const paramURL = qs.stringify(parameters);
  var apiURL = url+'?'+paramURL;
  request(apiURL, function(error, response, body){
    let businesses = JSON.parse(body).businesses;
    let localBusinesses = [];
    businesses.forEach(function(business){
      Location.findById(business.id, function(err, location){
        if(err) throw err;
        if(!location){
          if(!business.image_url) business.image_url = "http://i.imgur.com/sEHRlvG.png"
          Location.create({_id: business.id, name: business.name, image: business.image_url, rating: business.rating, attendees: 0}, function(err, newLocation){
            if(err) throw err;
            localBusinesses = localBusinesses.concat(newLocation);
            if(localBusinesses.length === businesses.length) res.end(JSON.stringify(localBusinesses));
          });
        }
        else{
          localBusinesses.push(location);
          if(localBusinesses.length === businesses.length) res.end(JSON.stringify(localBusinesses));
        }
      });
    });
  });
});

app.get('/api/currentuser', function(req, res){
  if(req.user){
    res.end(JSON.stringify(req.user));
  }
  else{
    res.end(JSON.stringify(false));
  }
});

app.get('/api/loginsuccess', function(req, res){
  req.session.user = req.user;
  res.redirect('/');
});

app.get('/api/recentsearch', function(req, res){
  req.session.recentSearch ? res.end(JSON.stringify({res: req.session.recentSearch})) : res.end(JSON.stringify(false));
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/api/loginsuccess',
                                     failureRedirect: '/failure' }));

app.patch('/api/rsvp', function(req, res){
  User.findById(req.session.user._id, function(err, user){
    if(err) throw err;
    if(user.going.indexOf(req.body.location) < 0){
      user.going = user.going.concat(req.body.location);
      user.save(function(err){
        if(err) throw err;
        Location.findById(req.body.location, function(err, location){
          location.attendees = location.attendees + 1;
          location.save(function(err, d){
            if(err) throw err;
            res.end(JSON.stringify(d));
          })
        })
      })
    }
    else{
      Location.findById(req.body.location, function(err, location){
        location.attendees = location.attendees - 1;
        location.save(function(err, newLocation){
          if(err) throw err;
          User.findById(req.user._id, function(err, user){
            var index = user.going.indexOf(newLocation._id);
            user.going.splice(index, 1);
            user.save(function(err){
              res.end(JSON.stringify(newLocation));
            })
          })
        });
      });
    }
  });
});

app.post('/api/recentsearch', function(req, res){
  req.session.recentSearch = req.body.search;
  res.end(JSON.stringify(req.session.recentSearch));
});

app.get('*', function(req, res){
	res.sendFile(__dirname + '/client/public/index.html');
});


app.listen(process.env.PORT || 3000);