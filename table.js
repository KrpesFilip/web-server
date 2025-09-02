const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');

        // Query all rows in the anime_list table
        db.all('SELECT * FROM anime_list', [], (err, rows) => {
            if (err) {
                console.error('Error fetching data', err.message);
            } else {
                console.log('Contents of anime_list table:');
                console.table(rows); // Prints table in nice format
            }

            // Close the database
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
