const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your-secret-key';

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

// Add anime to cache (unique cache, no user-specific info)
app.post('/api/anime/cache', (req, res) => {
    const { mal_id, status, title, synopsis, duration, aired, season, image_url, rank, score, scored_by, popularity, rating, source } = req.body;

    if (!mal_id || !title) {
        return res.status(400).json({ error: 'MAL ID and title are required' });
    }

    const query = `
        INSERT OR IGNORE INTO anime_cache 
        (mal_id, status, title, synopsis, duration, aired, season, image_url, rank, score, scored_by, popularity, rating, source) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [mal_id, status, title, synopsis, duration, aired, season, image_url, rank, score, scored_by, popularity, rating, source], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Anime cached successfully', id: this.lastID });
    });
});

// Get a single anime from cache by MAL ID
app.get('/api/anime/cache/:mal_id', (req, res) => {
    const mal_id = req.params.mal_id;

    const query = 'SELECT * FROM anime_cache WHERE mal_id = ?';
    db.get(query, [mal_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json({ data: null });
        res.json({ data: row });
    });
});



// API Route to Add a New User
app.post('/api/anime', (req, res) => {
    const { mal_id, status, username } = req.body;

    console.log("Request body received:", req.body);

    if (!mal_id || !status || !username) {
        return res.status(400).json({ error: 'MAL ID. Status and Username are required' });
    }

    const query = 'INSERT INTO anime_list (mal_id, status, username) VALUES (?, ?, ?)';
    db.run(query, [mal_id, status, username], function (err) {
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

// =================== REGISTER ===================
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Error hashing password' });

        const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
        db.run(query, [username, hash, role], function (err) {
            if (err) {
                return res.status(500).json({ error: 'User already exists or DB error' });
            }
            res.json({ message: 'User registered successfully', id: this.lastID });
        });
    });
});

// =================== LOGIN ===================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) return res.status(500).json({ error: 'Error checking password' });
            if (!match) return res.status(400).json({ error: 'Invalid username or password' });

            // Create a JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: '1h' }
            );

            res.json({ message: 'Login successful', token });
        });
    });
});

// Middleware to verify admin
function verifyAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
        req.user = decoded;
        next();
    });
}

// Get all users (admin only)
app.get('/api/admin/users', verifyAdmin, (req, res) => {
    console.log("Admin route hit by:", req.user);
    db.all('SELECT id, username, role FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: rows });
    });
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
        return res.status(400).json({ error: "Admins cannot delete themselves" });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
    });
});



// app.use(express.static(path.join(__dirname, '../client/build')));

//app.get('/*', (req, res) => {
//    console.log('Serving React app for route:', req.originalUrl);
//    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
//});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
