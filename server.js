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

// Open usenergy.sqlite3 database
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


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home',(req, res) => {
    console.log('home');
});

// GET request handler for '/codes'
app.get('/codes',(req, res) => {
    console.log('codes');
});

// GET request handler for '/neighborhoods'
app.get('/neighborhoods', (req, res) => {
    console.log('neighborhoods');
});

// GET request handler for '/incidents'
app.get('/incidents', (req, res) => {
    console.log('incidents');
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});