var express = require('express');
var router = express.Router();
var spotifyController = require('../controller/SpotifyController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'How basic are you?' });
});

router.get('/howBasicRU', function(req, res, next) {
  var fraction = req.session.fraction;
  var basicality = req.session.basicality;
  var topArtists = req.session.myTopArtists;
  console.log("length: " + topArtists.length);
  res.render('result', {
    title: 'results',
    fraction: fraction,
    basicality: basicality,
    topArtists: topArtists
  })
});

router.get('/callback', function(req, res) { 
  spotifyController.callbackSpotify(req, res)
});

router.get('/login', function(req, res) {
  spotifyController.loginSpotify(res)
});

module.exports = router;
