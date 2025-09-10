const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt'); // for hashing passwords

const db = new sqlite3.Database('./mydatabase.db');

const username = 'admin';
const password = 'admin22';
const role = 'admin';

// Hash the password before saving
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        return console.error('Error hashing password:', err.message);
    }

    db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [username, hash, role],
        function (err) {
            if (err) {
                console.error('Error inserting user:', err.message);
            } else {
                console.log(`✅ User added with id ${this.lastID}`);
            }

            db.close();
        }
    );
});
