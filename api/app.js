const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const session = require('express-session');
const passport = require('passport');
require('../config/passport');

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: 'hcrp_session_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
const auth = require('../routes/auth');
const admin = require('../routes/admin');
app.use('/auth', auth);
app.use('/admin', admin);

// Root
app.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Vercel requirement: export the app
module.exports = app;