// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;

// Open stpaul_crime.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
//app.use(express.static(public_dir));


// GET request handler for home page '/' 
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home',(req, res) => {
    console.log('home');
});

// GET request handler for '/codes'
app.get('/codes',(req, res) => {
    console.log('codes');
    console.log(req.query);

    if(Object.entries(req.query).length === 0) {
        db.all('SELECT * FROM Codes', (err, rows) => {
            res.status(200).type('json').send(rows);
        });
    }
    else {
        let query_rows = req.query.code.split(',');
        
        console.log("query rows: " + query_rows);
        var response=[];

        let query_promise = new Promise((resolve, reject) => {
            query_rows.forEach(code => {
                db.get('SELECT * FROM Codes WHERE code = ?', [code], (err, row) => {
                    if(err || typeof row == 'undefined') {
                        reject('Not a valid Code: ' + code);
                    }
                    else {
                        response.push(row);
                        if(response.length === query_rows.length) {
                            resolve(response);
                        }
                    }
                });
            });
        });

        query_promise.then( (data) => {
            res.status(200).type('json').send(data);
        }).catch((error) => {
            console.log(error)
            res.status(404).send("404 File Not Found - " + error);
        });
    /*
            query_rows.forEach(code => {
                db.get('SELECT * FROM Codes WHERE code = ?', [code], (err, row) => {
                    if(err) {
                        console.log('not a valid code');
                    }
                    else {
                        response.push(row);
                        if(response.length === query_rows.length) {
                            res.status(200).type('json').send(response);
                        }
                    }
                });
            });
    */
    }
});


// GET request handler for '/neighborhoods'
app.get('/neighborhoods', (req, res) => {
    console.log('neighborhoods');
    console.log(req.query.id);

    if(Object.entries(req.query).length === 0) {
        db.all('SELECT * FROM Neighborhoods order by neighborhood_number', (err, rows) => {
            res.status(200).type('json').send(rows);
        });
    }
    else {
        let query_rows = req.query.id.split(',');
        var response=[];

        query_rows.forEach(code => {
            db.get('SELECT * FROM Neighborhoods WHERE neighborhood_number = ? order by neighborhood_number', [code], (err, row) => {
                if(err) {
                    console.log('not a valid neighborhood id');
                }
                else {
                    response.push(row);
                    if(response.length === query_rows.length) {
                        res.status(200).type('json').send(response);
                    }
                }
            });
        });
    }
});

// GET request handler for '/incidents'
app.get('/incidents', (req, res) => {
    console.log('incidents');

    let incidentPromise = new Promise((resolve, reject) => {
        db.all('SELECT case_number, DATE(date_time) AS \'date\', TIME(date_time) AS \'time\', code, incident, police_grid, neighborhood_number, block FROM Incidents ORDER BY date_time;', (err, rows) => {
            resolve(rows);
        })
    });

    Promise.all([incidentPromise]).then((results) => {
        res.status(200).type('json').send(results);
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});