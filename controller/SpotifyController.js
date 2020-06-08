var SpotifyWebApi = require('spotify-web-api-node');
var querystring = require('querystring');

var client_id = process.env.SPOTIFYAPICLIENTID;
var client_secret = process.env.SPOTIFYAPICLIENTSECRET;
var redirect_uri_path = '/callback'; 
var redirect_uri = 'http://localhost:3000/callback';
var stateKey = 'spotify_auth_state'
var globalTopFiftyId = '37i9dQZEVXbMDoHDwVN2tF';


/**
 * Function to log into Spotify
 */
module.exports.loginSpotify = function(req, res) {
    var state = generateRandomString(16);
    redirect_uri = req.protocol + '://' + req.get('host') + redirect_uri_path;
    console.log(redirect_uri);
    res.cookie(stateKey, state);

    var scope = 'user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        })
    );
}

var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret
});

/**
 * Function to get an user's top artists and match to the global top 50
 */
module.exports.callbackSpotify = function(req, res) {
    spotifyApi.setRedirectURI(redirect_uri);
    spotifyApi.authorizationCodeGrant(req.query.code).then(function(data) {
        spotifyApi.setAccessToken(data.body.access_token);
        spotifyApi.setRefreshToken(data.body.refresh_token);
        return spotifyApi.getMe()

    }).then(function(data) {
        spotifyApi.getMyTopArtists({
            limit: 15
        })
        .then(function(data) {
            req.session.myTopArtists = data.body.items.map(function(a, i) {
                var name = a.name;
                console.log(i + 1 + ": " + name);
                return name;
            })
            return data.body.items.map(function(a) {
                return a.id;
            });
        })
        .then(function(artistIds) {
            spotifyApi.getPlaylistTracks(globalTopFiftyId)
            .then(function(data) {
                tracks = data.body.items.map(function(t) {
                    console.log(t.track.name);
                    return t.track;
                });
                var topFiftyArtistIds = [];
                tracks.forEach(function(t) {
                    t.artists.forEach(function(a) {
                        topFiftyArtistIds.push(a.id);
                    });
                });
                var numMatches = 0;
                artistIds.forEach(function(arid) {
                    if (topFiftyArtistIds.includes(arid)) {
                        numMatches++;
                    }
                })
                console.log("Number of matches: " + numMatches);
                req.session.fraction = numMatches + "/" + artistIds.length;
                var basicality = numMatches/artistIds.length;
                req.session.basicality = basicality;
                res.redirect('/howBasicRU');
            },
            function(err) {
                console.error(err);
            })
        });
    },
    function(err) {
        console.error(err);
    });
}

/**
 * Generates a random string containing numbers and letters.
 * Takem from Spotufy's Web Auth Tutorial.
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
