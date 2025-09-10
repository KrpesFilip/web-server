const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');

        // Create anime_list table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS anime_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mal_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                username TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating anime_list table', err.message);
            } else {
                console.log('Table anime_list is ready.');

                // Print contents of anime_list
                db.all('SELECT * FROM anime_list', [], (err, rows) => {
                    if (err) {
                        console.error('Error fetching anime_list data', err.message);
                    } else {
                        console.log('Contents of anime_list:');
                        console.table(rows);
                    }
                });
            }
        });

        // Create users table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'user'))
            )
        `, (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            } else {
                console.log('Table users is ready.');

                // Print contents of users
                db.all('SELECT * FROM users', [], (err, rows) => {
                    if (err) {
                        console.error('Error fetching users data', err.message);
                    } else {
                        console.log('Contents of users:');
                        console.table(rows);
                    }

                    // Close DB after both queries finish
                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database', err.message);
                        } else {
                            console.log('Database connection closed.');
                        }
                    });
                });
            }
        });

        db.run(`
    CREATE TABLE IF NOT EXISTS anime_cache (
        mal_id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        synopsis TEXT,
        trailer TEXT,
        duration TEXT,
        aired TEXT,
        season TEXT,
        image_url TEXT,
        rank INTEGER,
        score REAL,
        scored_by INTEGER,
        popularity INTEGER,
        status TEXT,
        rating TEXT,
        source TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Error creating table:", err.message);
    else console.log("anime_cache table ready.");
});

db.all('SELECT * FROM anime_cache', [], (err, rows) => {
    if (err) {
        console.error('Error fetching anime cache:', err.message);
        return;
    }

    if (rows.length === 0) {
        console.log('No anime found in cache.');
        return;
    }

    console.log('Anime Cache Table:');
    rows.forEach((row) => {
        console.log(row); // prints each anime object
    });
});
    }




});
