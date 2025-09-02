const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3001;

app.use(cors());
// Middleware to parse JSON
app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Connect to SQLite database
const db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// API Route to Add a New User
app.post('/api/anime', (req, res) => {
    const { mal_id, status } = req.body;

    if (!mal_id || !status) {
        return res.status(400).json({ error: 'MAL ID and Status are required' });
    }

    const query = 'INSERT INTO anime_list (mal_id, status) VALUES (?, ?)';
    db.run(query, [mal_id, status], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'New anime added', id: this.lastID });
    });
});

// Express route to fetch all items from the database
app.get('/api/anime', (req, res) => {
    db.all('SELECT * FROM anime_list', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
	
        console.log('Fetched data:', rows); // Print the data here
	
        res.json({
            data: rows
        });
    });
});

// Express route to update the status of an anime item
app.put('/api/anime/:id', (req, res) => {
    const { status } = req.body;
    const id = req.params.id;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const query = 'UPDATE anime_list SET status = ? WHERE id = ?';
    db.run(query, [status, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Anime item not found' });
        }

        res.json({ message: 'Anime status updated' });
    });
});

// Api Route to Delete an Anime Item
app.delete('/api/anime/:id', (req, res) => {
    const id = req.params.id;

    const query = 'DELETE FROM anime_list WHERE id = ?';
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Error deleting anime item:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Anime item not found' });
        }

        res.json({ message: 'Anime item deleted successfully' });
    });
});

//app.use(express.static(path.join(__dirname, '../client/build')));

//app.get('/*', (req, res) => {
//    console.log('Serving React app for route:', req.originalUrl);
//    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
//});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
