var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'site',
    multipleStatements: true,
});

/*
Regular express setup truncated
*/

router.get('/message/:id', (req, res) => {
    if (req.session) {
        var sql = `SELECT * from message WHERE id=${req.params.id}`;

        db.query(sql, (err, result) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        });
    }
});

router.post('/addPerson', (req, res) => {
    let sql444 = `INSERT INTO people (post, uuid, location) SELECT * FROM (SELECT ${req.body.post}, "${req.body.uuid}", "${req.body.location}") AS \`values\` WHERE post=${req.body.post} AND uuid="${req.body.uuid}") LIMIT 1;`

    db.query(sql444, (e, r) => {
        if (e) throw e;


        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "true" }));
    });
});

router.post('/addPerson', (req, res) => {
    if(!req.session) return;

    let sql141 = `INSERT INTO people (post, uuid, location) SELECT * FROM (SELECT ?, ?, ?") AS \`values\` WHERE NOT EXISTS (SELECT * FROM people WHERE post=? AND uuid=?) LIMIT 1;`

    db.query(sql141, [req.body.post_id, req.body.uuid, req.body.location, req.body.post_id, req.body.uuid], (e, r) => {
        if (e) throw e;


        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "true" }));
    });
});