const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/your-database-name', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to the database.');
});

app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String
}));


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});









app.post('/register', (req, res) => {
    const { username, password } = req.body;
    User.register(new User({ username }), password, (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error registering user.' });
        }
        passport.authenticate('local')(req, res, () => {
            return res.json({ message: 'User registered successfully.' });
        });
    });
});

app.post('/login', passport.authenticate('local'), (req, res) => {
    return res.json({ message: 'Login successful.' });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Logged out.' });
});






const axios = require('axios');
const cheerio = require('cheerio');

app.post('/scrape', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { flipkartUrl } = req.body;

    axios.get(flipkartUrl)
        .then(response => {
            const $ = cheerio.load(response.data);
            const title = $('span[class="B_NuCI"]').text();
            const price = $('div[class="_30jeq3 _16Jk6d"]').text();
            const description = $('div[class="_2c7YLP"]').text();
            const reviews = $('span[class="_2_R_DZ"]').text();
            const rating = $('div[class="_3LWZlK"]').text();
            const mediaCount = $('div[class="_2bKjT3"]').length;

          
            res.json({
                title,
                price,
                description,
                reviews,
                rating,
                mediaCount
            });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Error scraping the URL.' });
        });
});
