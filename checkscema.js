const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mydatabase.db');

db.run("INSERT INTO anime_list (mal_id, status, username) VALUES (?, ?, ?)", [1234, "Planning", "admin"], (err) => {
    if (err) console.log("Insert error:", err);
    else console.log("Insert worked!");
});


db.all("PRAGMA table_info(anime_list);", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(rows);
    }
    db.close();
});
