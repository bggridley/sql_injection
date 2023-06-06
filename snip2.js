const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const mysql = require('mysql');

var path = require('path');
var appDir = path.dirname(require.main.filename);

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stats'
});

// Connect
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySql Connected...');
    console.log("appDir: " + appDir);
});

const app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

router.get('/getplayer/:gamertag/:season', (req, res) => {
    let sql = `SELECT * FROM players WHERE gamertag='${req.params.gamertag}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getteam/:abbr/:season', (req, res) => {
    let sql = `SELECT * FROM teams WHERE abbr='${req.params.abbr}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getmatch/:matchid/:season', (req, res) => {
    let sql = `SELECT * FROM matches WHERE match_id='${req.params.matchid}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getgame/:matchid/:gameid/:season', (req, res) => {
    let sql = `SELECT * FROM games WHERE match_id='${req.params.matchid}' AND game_id='${req.params.gameid}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getgames/:matchid/:season', (req, res) => {
    let sql = `SELECT * FROM games WHERE match_id='${req.params.matchid}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;

        if (result != null) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('[]');
        }
    });
});

router.get('/getstats/:matchid/:gameid/:gamertag/:team/:season', (req, res) => {
    let sql = `SELECT * FROM stats WHERE match_id='${req.params.matchid}' AND game_id='${req.params.gameid}' AND season='${req.params.season}'`;
    
    if(req.params.gamertag !== '-1') {
       // console.log(req.params.gamertag);
        sql += ` AND gamertag='${req.params.gamertag}'`;
    } else {
       // console.log("no ss");
    }

    if(req.params.team !== '-1') {
        // console.log(req.params.gamertag);
         sql += ` AND team='${req.params.team}'`;
     } else {
        // console.log("no ss");
     }

    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getstats/:gamertag/:season', (req, res) => {
    let sql = `SELECT * FROM stats WHERE gamertag='${req.params.gamertag}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getplayersbyteam/:abbr/:season', (req, res) => {
    let sql = `SELECT * FROM players WHERE team='${req.params.abbr}' AND season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

app.use(express.static(__dirname));

router.get('/about', (req, res) => {
    res.sendFile('/index.html', {root: __dirname});
});

router.get('/getplayers/:season', (req, res) => {
    console.log("getting plyers by season: " + '${req.params.season}')
    let sql = `SELECT * FROM players WHERE season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.get('/getmatches/:season', (req, res) => {
    let sql = `SELECT * FROM matches WHERE season='${req.params.season}'`;
    
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});

router.post('/addplayer', (req, res) => {
    var s = req.body.season;
    var gamertag = req.body.gamertag;
    var first = req.body.first;
    var last = req.body.last;
    var image = req.body.image;
    var team = req.body.team;

    var names = ["gamertag", "first", "last", "team", "image", "season"];
    var values = [gamertag, first, last, team, image, s];

    insertInto("players", names, values, ["gamertag", "season"], [gamertag, s], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("added player: " + gamertag);
    }); // 0 means identify them by gamertag NEEDS A CALLBACK
});

router.post('/addstats', (req, res) => {
    var s = req.body.season;
    var gamertag = req.body.gamertag;
    var matchid = req.body.matchid;
    var gameid = req.body.gameid;
    var score = req.body.score;
    var kills = req.body.kills;
    var deaths = req.body.deaths;
    var plants = req.body.plants;
    var defuses = req.body.defuses;
    var team = req.body.team;

    var names = ["match_id", "game_id", "gamertag", "score", "kills", "deaths", "plants", "defuses", "team", "season"];
    var values = [matchid, gameid, gamertag, score, kills, deaths, plants, defuses, team, s];

    insertInto("stats", names, values, ["match_id", "game_id", "gamertag", "season"], [matchid, gameid, gamertag, s], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("added player stats: " + gamertag);
    }); // 0 means identify them by gamertag NEEDS A CALLBACK
});


router.get('/getteams/:season', (req, res) => {
    let sql = `SELECT * FROM teams WHERE season='${req.params.season}'`;
    let query = db.query(sql, (err, result) => {
        if (err) throw err;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
});


// will generate all the tables necessary so there aren't any errors
router.get('/generateDefaults', (req, res) => {
    let addLogins = "CREATE TABLE IF NOT EXISTS `logins` ( `username` VARCHAR(255) NOT NULL , `password` VARCHAR(255) NOT NULL ) ENGINE = InnoDB"
    let addTeams = "CREATE TABLE IF NOT EXISTS `teams` ( `team` VARCHAR(255) NOT NULL , `abbr` VARCHAR(255) NOT NULL, `season` int NOT NULL) ENGINE = InnoDB"
    let addPlayer = "CREATE TABLE IF NOT EXISTS `players` ( `gamertag` VARCHAR(255) NOT NULL, `first` VARCHAR(255) NOT NULL , `last` VARCHAR(255) NOT NULL , `team` VARCHAR(255) NOT NULL , `image` VARCHAR(255) NOT NULL, `season` int NOT NULL ) ENGINE = InnoDB"

    let addMatches = "CREATE TABLE IF NOT EXISTS `matches` ( `match_id` int NOT NULL AUTO_INCREMENT, `best_of` int NOT NULL , `team1` VARCHAR(255) NOT NULL , `team2` VARCHAR(255) NOT NULL, `season` int NOT NULL, PRIMARY KEY (match_id)) ENGINE = InnoDB"
    let addGames = "CREATE TABLE IF NOT EXISTS `games` ( `game_id` int NOT NULL, `match_id` int NOT NULL, `team1points` int NOT NULL , `team2points` int NOT NULL, `map` VARCHAR(255) NOT NULL, `gamemode` VARCHAR(255) NOT NULL, `season` int NOT NULL) ENGINE = InnoDB"
    let addsndStats = "CREATE TABLE IF NOT EXISTS `stats` ( `match_id` int NOT NULL, `game_id` int NOT NULL, `gamertag` VARCHAR(255) NOT NULL, `score` int NOT NULL , `kills` int NOT NULL, `deaths` int NOT NULL, `plants` int NOT NULL, `defuses` int NOT NULL, `team` VARCHAR(255) NOT NULL, `season` int NOT NULL) ENGINE = InnoDB"
    // let addhardpointStats = "CREATE TABLE IF NOT EXISTS `hardpoint_stats` ( `match_id` int NOT NULL, `game_id` int NOT NULL, `gamertag` VARCHAR(255) NOT NULL, `score` int NOT NULL , `kills` int NOT NULL, `deaths` int NOT NULL, `time` int NOT NULL, `defends` int NOT NULL) ENGINE = InnoDB"
    //include games in here SOON too

    db.query(addTeams, (err1, result1) => {
        if (err1) throw err1;

        db.query(addLogins, (err2, result2) => {
            if (err2) throw err2;

            db.query(addPlayer, (err3, result3) => {
                if (err3) throw err3;

                db.query(addMatches, (err4, result4) => {
                    if (err4) throw err4;

                    db.query(addGames, (err5, result5) => {
                        if (err5) throw err5;

                        db.query(addsndStats, (err6, result6) => {
                            if (err6) throw err6;

                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end("true");
                        });

                    });

                });
            });
        });
    });
});

router.post('/addteam', (req, res) => {

    var team = req.body.team;
    var abbr = req.body.abbr;
    var s = req.body.season;


    var names = ["team", "abbr", "season"];
    var values = [team, abbr, s];

    insertInto("teams", names, values, ["abbr", "season"], [abbr, s], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("added team: " + team);
    }); // 0 means identify them by their abbreviation, because this is what will be stored in the match info and stuff.
});

router.post('/addmatch', (req, res) => {

    var s = req.body.season;
    var team1 = req.body.team1;
    var team2 = req.body.team2;
    var bestOf = req.body.bestOf;
    var matchId = req.body.matchId;


    var names = ["season", "team1", "team2", "best_of"];
    var values = [s, team1, team2, bestOf];


    namesId = [];
    valuesId = []

    if (matchId != null) {
        names[4] = "match_id"
        values[4] = matchId;
        namesId[0] = "season";
        valuesId[0] = s;
        namesId[1] = "match_id";
        valuesId[1] = matchId;

    }

    console.log("length of NAMES: " + names.length);



    insertInto("matches", names, values, namesId, valuesId, function (id) {

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(id + "");
        console.log("added match: " + team1 + "vs" + team2 + ", Id:" + id);
    }); // 0 means identify them by their abbreviation, because this is what will be stored in the match info and stuff.
});

router.post('/addgame', (req, res) => {

    var s = req.body.season;
    var matchid = req.body.matchId;
    var gameid = req.body.gameId;
    var team1p = req.body.team1points;
    var team2p = req.body.team2points;
    var map = req.body.map;
    var gamemode = req.body.gamemode;


    var names = ["game_id", "match_id", "team1points", "team2points", "map", "gamemode", "season"];
    var values = [gameid, matchid, team1p, team2p, map, gamemode, s];

    insertInto("games", names, values, [names[0], names[1], "season"], [values[0], values[1], s], function (id) {

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("added game: " + gameid + " with matchID:" + matchid);
    }); // 0 means identify them by their abbreviation, because this is what will be stored in the match info and stuff.
});



router.post('/deleteplayer', (req, res) => {
    var gamertag = req.body.gamertag;
    deleteFrom("players", ["gamertag"], [gamertag], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("delete player: " + gamertag);
    });
});

router.post('/deletestats', (req, res) => {
    var gamertag = req.body.gamertag;
    var gameid = req.body.gameid;
    var matchid = req.body.matchid;

    names = ["gamertag", "game_id", "match_id"];
    values = [gamertag, gameid, matchid];

    if (gameid == -1 && gamertag == null) {
        names = ["match_id"];
        values = [matchid];
    }

    deleteFrom("stats", names, values, function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
    });
});

router.post('/deletematch', (req, res) => {
    var matchId = req.body.matchId;
    deleteFrom("matches", ["match_id"], [matchId], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("delete match: " + matchId);
    });
});

router.post('/deletegame', (req, res) => {
    var matchId = req.body.matchId;
    var gameId = req.body.gameId;

    var names = ["match_id"];
    var values = [matchId];

    if (gameId !== -1) {
        names[1] = "game_id";
        values[1] = gameId;
    }

    deleteFrom("games", names, values, function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("delete game: " + gameId + "from " + matchId);
    });
});

router.post('/deleteteam', (req, res) => {
    var abbr = req.body.abbr;
    deleteFrom("teams", ["abbr"], [abbr], function () {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("true");
        console.log("delete team: " + abbr);
    });
});



// these all go
function insertInto(table, names, values, namesId, valuesId, callback) { // identifier is an INT
    deleteFrom(table, namesId, valuesId, function () {
        insert(table, names, values, function (result) {
            callback(result.insertId);
        });
    });
}

function insert(table, names, values, callback) {
    let sql = "INSERT INTO `" + table + "` (";

    for (var i = 0; i < names.length; i++) {
        sql += "`";
        sql += names[i];
        sql += "`";
        if (i != names.length - 1) sql += ", ";
        else sql += ")"
    }

    sql += " VALUES (";

    for (var i = 0; i < values.length; i++) {
        sql += "'";
        sql += values[i];
        sql += "'";
        if (i != values.length - 1) sql += ", ";
        else sql += ")"
    }

    db.query(sql, (e, r) => {
        if (e) {
            throw e;
        }

        callback(r);
    });
}

router.post('/login', (req, res) => {
    var user = req.body.username;
    var pass = req.body.password;

    var query = "SELECT * FROM logins WHERE username='" + user + "' AND password='" + pass + "'";

    db.query(query, (e, r) => {
        // should make test DB
        if (e) throw e;
        res.writeHead(200, { 'Content-Type': 'text/plain' });



        var stringified = JSON.stringify(r);
        if (stringified == "[]") {
            res.end("false");
            console.log()
        } else {
            res.end("true");
        }
    });






    //var team = req.body.username;
    // var abbr = req.body.password;
});

function deleteFrom(table, names, values, callback) {
    let add = "";

    if (names[0] == null || values[0] == null) {
        console.log("leaving early.");
        callback();
        return;
    }

    for (var i = 0; i < names.length; i++) {
        add += names[i] + "='" + values[i] + "'";

        if (!(typeof names[i + 1] === 'undefined')) {
            add += " AND "
        }
    }

    var deleteSql = "DELETE FROM " + table + " WHERE " + add;

    let dquery = db.query(deleteSql, (e, r) => {
        if (e) throw e;
        callback();
    });
}


app.use('/', router);


app.listen('3000', () => {
    console.log('Server started on port 3000');
});