// app.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const upload = multer({ dest: 'uploads/' });
const db = new Database('golf.db');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.array('files'), (req, res) => {
  let pending = req.files.length;

  req.files.forEach(file => {
    const shots = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Club'] && row['Carry Distance']) {
          const carry = parseFloat(row['Carry Distance']);
          if (!isNaN(carry)) {
            shots.push({ club: row['Club'], carry_distance: carry });
          }
        }
      })
      .on('end', () => {
        const insert = db.prepare(`INSERT INTO shots (club, carry_distance) VALUES (?, ?)`);
        const insertMany = db.transaction((shots) => {
          for (const shot of shots) {
            insert.run(shot.club, shot.carry_distance);
          }
        });
        insertMany(shots);

        fs.unlinkSync(file.path); // Clean up temp file
        pending--;
        if (pending === 0) res.redirect('/results');
      });
  });
});

app.get('/results', (req, res) => {
  const stmt = db.prepare(`
    SELECT club, AVG(carry_distance) AS avg_carry
    FROM shots
    GROUP BY club
    ORDER BY avg_carry DESC
  `);
  const results = stmt.all();
  res.render('results', { results });
});

// DELETE all data
app.post('/delete-all', (req, res) => {
    db.exec('DELETE FROM shots');
    res.redirect('/results');
  });
  
  // DELETE data by club name
  app.post('/delete-club', express.urlencoded({ extended: true }), (req, res) => {
    const club = req.body.club;
    db.prepare('DELETE FROM shots WHERE club = ?').run(club);
    res.redirect('/results');
  });
  

app.listen(3000, () => {
  console.log("🌐 Server running at http://localhost:3000");
});
