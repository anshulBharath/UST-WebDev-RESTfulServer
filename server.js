// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
let cors = require('cors');




let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;
app.use(cors());

app.use(cors());
app.use(express.json()) // for parsing application/json


// Open stpaul_crime.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' 
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home',(req, res) => {
    console.log('home');
    fs.readFile(path.join(public_dir, 'index.html'), 'utf-8', (err, page) => {
        if(err){
            res.status(404).send("Error: File Not Found");
        }
        else { 
            res.status(200).type('html').send(page);
        }
    });
});

app.get('/about',(req, res) => {
    console.log('about');
    fs.readFile(path.join(public_dir, 'about.html'), 'utf-8', (err, page) => {
        if(err){
            res.status(404).send("Error: File Not Found");
        }
        else { 
            res.status(200).type('html').send(page);
        }
    });
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
    else if(req.query.code_name != null) {
        let query_rows = req.query.code_name.split(',');
        
        console.log("query rows: " + query_rows);

        let query_promise = new Promise((resolve, reject) => {
            let queryString = 'SELECT * FROM Codes WHERE (incident_type LIKE ';
            let tempString = '';
            query_rows.forEach(code => {
                tempString += '\'%' + code + '%\' OR incident_type LIKE ';
            });

            queryString += tempString;

            queryString = queryString.slice(0, queryString.length-23);
            queryString += ');'
            console.log(queryString);

            db.all(queryString, (err, rows) => {
                if(err || typeof rows == 'undefined') {
                    reject('Not a valid Query: ' + err);
                }
                else {
                    resolve(rows);
                }
            });
            
        });

        query_promise.then( (data) => {
            res.status(200).type('json').send(data);
        }).catch((error) => {
            console.log(error)
            res.status(404).send("404 File Not Found - " + error);
        });
    }
    else {
        let query_rows = req.query.code.split(',');
        
        console.log("query rows: " + query_rows);
        var response=[];

        let query_promise = new Promise((resolve, reject) => {
            query_rows.forEach(code => {
                db.all('SELECT * FROM Codes WHERE code = ?', [code], (err, row) => {
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
            db.all('SELECT * FROM Neighborhoods WHERE neighborhood_number = ? order by neighborhood_number', [code], (err, row) => {
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

    let query = '';
    let selectStatement = 'SELECT case_number, DATE(date_time) AS \'date\', TIME(date_time) AS \'time\', code, incident, police_grid, neighborhood_number, block FROM Incidents WHERE ';
    
    let startEndDateQuery = '';
    let startEndTimeQuery = '';
    let codeQuery = 'code';
    let gridQuery = 'police_grid';
    let hoodQuery = 'neighborhood_number';
    let limitQuery = '';

    if(req.query.start_date != null && req.query.end_date != null){
        startEndDateQuery += 'date >= \'' + req.query['start_date'] + '\' AND date <= \'' + req.query['end_date'] + '\'';
    }
    else if(req.query.start_date != null){
        startEndDateQuery += 'date >= \'' + req.query['start_date'] + '\'';
    }
    else if(req.query.end_date != null){
        startEndDateQuery +=  'date <= \'' + req.query['end_date'] + '\'';
    }

    if(req.query.start_time != null && req.query.end_time != null){
        startEndTimeQuery += 'time >= \'' + req.query['start_time'] + '\' AND time <= \'' + req.query['end_time'] + '\'';
    }
    else if(req.query.start_time != null){
        startEndTimeQuery += 'time >= \'' + req.query['start_time'] + '\'';
    }
    else if(req.query.end_time != null){
        startEndTimeQuery +=  'time <= \'' + req.query['end_time'] + '\'';
    }

    if(req.query.limit != null){
        limitQuery += 'LIMIT ' + req.query['limit'];
    }
    else{
        limitQuery += 'LIMIT 1000';
    }

    
    if(req.query.code != null){
        let query_rows = req.query.code.split(',');
        codeQuery = 'code IN (';
        
        for(let i=0; i<query_rows.length-1; i++){
            codeQuery += query_rows[i] + ', ';
        }
        
        codeQuery += query_rows[query_rows.length-1] + ')';
    }

    if(req.query.grid != null){
        let query_rows = req.query.grid.split(',');
        gridQuery = 'police_grid IN (';
        
        for(let i=0; i<query_rows.length-1; i++){
            gridQuery += query_rows[i] + ', ';
        }
        
        gridQuery += query_rows[query_rows.length-1] + ')';
    }

    if(req.query.neighborhood != null){
        let query_rows = req.query.neighborhood.split(',');
        hoodQuery = 'neighborhood_number IN (';
        
        for(let i=0; i<query_rows.length-1; i++){
            hoodQuery += query_rows[i] + ', ';
        }
        
        hoodQuery += query_rows[query_rows.length-1] + ')';
    }

    let timeAndDateQuery = '';
    if(startEndDateQuery.length > 0 && startEndTimeQuery.length > 0){
        timeAndDateQuery += startEndDateQuery + ' AND ' + startEndTimeQuery;
    }
    else if(startEndDateQuery.length > 0){
        timeAndDateQuery += startEndDateQuery;
    }
    else if(startEndTimeQuery.length > 0){
        timeAndDateQuery += startEndTimeQuery;
    }

    if(timeAndDateQuery.length === 0){
        query += selectStatement + codeQuery + ' AND ' + gridQuery + ' AND ' + hoodQuery + ' ORDER BY date_time DESC ' + limitQuery;
    }
    else {
        query += selectStatement + timeAndDateQuery + ' AND ' + codeQuery + ' AND ' + gridQuery + ' AND ' + hoodQuery + ' ORDER BY date_time DESC ' + limitQuery;
    }

    console.log(query);



    let incidentPromise = new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if(err || typeof rows == 'undefined') {
                reject('Invalid Query');
            }
            else {
                resolve(rows);
            }
            
        });
    });

    incidentPromise.then((data) => {
        res.status(200).type('json').send(data);
    }).catch((error) => {
        console.log(error)
        res.status(404).send("404 File Not Found - " + error);
    });  

    
});


app.delete('/remove-incident', (req, res) => {
    db.all("SELECT * FROM incidents where case_number = ?", [req.query.case_number], (err, rows) => {
        if (err) {
            res.status(500).send('Error accessing database')
        } else {
            if (rows.length < 1) {
                res.status(500).send("Case number not found");
            } else {
                db.run('DELETE FROM incidents where case_number = ?', [req.query.case_number], (err) => {
                    if (err) {
                        res.status(500).send("Error deleting entry in database")
                    } else {
                        console.log(this);
                        res.status(200).send("Successfully deleted entry " + req.query.case_number);
                    }
                });
            }
        }
    })
});


app.put('/new-incident', (req, res) => {
    console.log(req.body);
    let date_time = req.body.date + "T" + req.body.time;
    console.log(date_time);  
    
    db.run(`INSERT INTO incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [req.body.case_number, date_time, req.body.code, req.body.incident, req.body.police_grid, req.body.neighborhood_number, req.body.block],
        (err, row) => {
            if (err) {
                if(err.message.includes("UNIQUE")) {
                    res.status(500).json({ "error": " case_number is already in use: " + err.message })
                }
                else {
                    res.status(500).json({ "error": err.message })
                }
                return;
            }
            console.log("row: " + row);
            res.status(200).send('put successful');
        });
    
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});