const express = require('express');
const router = express.Router();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
require('dotenv').config();

const scopes = ['identify']; // cukup pakai "identify" untuk awal

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'guilds']
}, function (accessToken, refreshToken, profile, done) {
  // Pastikan guild valid
  const guild = profile.guilds.find(g => g.id === process.env.GUILD_ID);
  if (!guild) return done(null, false, { message: 'Kamu bukan bagian dari server Haven City Roleplay' });
  return done(null, profile);
}));

// ⬅️ Login Page
router.get('/login', passport.authenticate('discord'));

// ⬅️ Callback dari Discord setelah login
router.get('/callback', (req, res, next) => {
  passport.authenticate('discord', (err, user, info) => {
    console.log('✅ [DEBUG] err:', err);
    console.log('✅ [DEBUG] user:', user);
    console.log('✅ [DEBUG] info:', info);

    if (err) {
      return res.send('❌ Login gagal (passport error): ' + err.message);
    }
    if (!user) {
      return res.send('❌ Login gagal (user not found): ' + (info?.message || 'tidak diketahui'));
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.send('❌ Login gagal (session error): ' + err.message);
      }
      return res.redirect('/admin/dashboard');
    });
  })(req, res, next);
});

// ⬅️ Logout
router.get('/logout', function (req, res) {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;