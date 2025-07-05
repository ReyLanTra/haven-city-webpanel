const express = require('express');
const router = express.Router();
const isAdmin = require('../utils/isAdmin');
const db = require('../config/db');
const samp = require('samp-query');

router.get('/dashboard', isAdmin, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user,
    loginTime: new Date().toLocaleString('id-ID'),
  });
});

router.get('/aksi', isAdmin, (req, res) => {
  res.render('aksi-admin', {
    title: 'Aksi Admin',
    user: req.user,
    message: null
  });
});

router.get('/monitoring', isAdmin, async (req, res) => {
  const options = {
    host: '188.166.208.28',
    port: 7777,
    timeout: 2000,
    players: true
  };

  samp(options, (error, response) => {
    if (error) {
      return res.render('monitoring', {
        title: 'Monitoring Server',
        user: req.user,
        status: 'Offline',
        error: error.message,
        data: null
      });
    }

    res.render('monitoring', {
      title: 'Monitoring Server',
      user: req.user,
      status: 'Online',
      error: null,
      data: {
        hostname: response.hostname,
        gamemode: response.gamemode,
        mapname: response.mapname,
        online: response.online,
        maxplayers: response.maxplayers,
        players: response.players
      }
    });
  });
});

router.get('/pemain', isAdmin, async (req, res) => {
  try {
    const [players] = await db.query(`
      SELECT username, money, gold, armour, health, phone, skin, level, admin, last_login, warn, jail
      FROM players
      ORDER BY last_login DESC
      LIMIT 100
    `);

    res.render('pemain', {
      title: 'Data Pemain',
      user: req.user,
      players
    });
  } catch (err) {
    console.error(err);
    res.render('pemain', {
      title: 'Data Pemain',
      user: req.user,
      players: [],
      error: 'Gagal mengambil data pemain.'
    });
  }
});

router.post('/aksi', isAdmin, async (req, res) => {
  const action = req.body.action;
  const player = req.body.player;
  let message = '✅ Aksi berhasil dijalankan.';

  try {
    if (!player || typeof player !== 'string') throw new Error('Nama player tidak valid.');

    const amount = req.body[`amount_${action}`] || null;
    const reason = req.body[`ban_reason_${action}`] || null;
    const vipLevel = req.body.vip_level || null;
    const vipDuration = req.body.vip_duration || null;

    switch (action) {
      case 'setmoney':
        await db.query('UPDATE players SET money = ? WHERE username = ?', [amount, player]);
        break;
      case 'sethp':
        await db.query('UPDATE players SET health = ? WHERE username = ?', [amount, player]);
        break;
      case 'setarmor':
        await db.query('UPDATE players SET armour = ? WHERE username = ?', [amount, player]);
        break;
      case 'setweapon':
        await db.query('UPDATE players SET Gun1 = ? WHERE username = ?', [amount, player]);
        break;
      case 'setphonenumber':
        await db.query('UPDATE players SET phone = ? WHERE username = ?', [amount, player]);
        break;
      case 'setrekening':
      case 'setbankmoney':
        await db.query('UPDATE players SET bmoney = ? WHERE username = ?', [amount, player]);
        break;
      case 'setskin':
        await db.query('UPDATE players SET skin = ? WHERE username = ?', [amount, player]);
        break;
      case 'setgold':
        await db.query('UPDATE players SET gold = ? WHERE username = ?', [amount, player]);
        break;
      case 'setadminlevel':
        await db.query('UPDATE players SET admin = ? WHERE username = ?', [amount, player]);
        break;
      case 'setadminname':
        await db.query('UPDATE players SET adminname = ? WHERE username = ?', [amount, player]);
        break;
      case 'setname':
        await db.query('UPDATE players SET username = ? WHERE username = ?', [amount, player]);
        break;
      case 'resetweapon':
        const resetGuns = Array(13).fill(0);
        await db.query(`UPDATE players SET 
          Gun1=?, Gun2=?, Gun3=?, Gun4=?, Gun5=?, Gun6=?, Gun7=?, 
          Gun8=?, Gun9=?, Gun10=?, Gun11=?, Gun12=?, Gun13=? 
          WHERE username = ?`, [...resetGuns, player]);
        break;
      case 'banplayer':
        const [rows] = await db.query('SELECT ip FROM players WHERE username = ?', [player]);
        if (!rows.length) throw new Error('Player tidak ditemukan.');
        await db.query('INSERT INTO banneds (name, ip, reason, admin) VALUES (?, ?, ?, ?)', [player, rows[0].ip, reason, req.user.username]);
        break;
      case 'warning':
        await db.query('UPDATE players SET warn = warn + 1 WHERE username = ?', [player]);
        break;
      case 'jail':
        await db.query('UPDATE players SET jail = 1, jail_time = ? WHERE username = ?', [amount, player]);
        break;
      case 'setvip':
        let vipTime = 0;
        if (parseInt(vipDuration) > 0) {
          const expire = new Date();
          expire.setDate(expire.getDate() + parseInt(vipDuration));
          vipTime = Math.floor(expire.getTime() / 1000);
        }
        await db.query('UPDATE players SET vip = ?, vip_time = ? WHERE username = ?', [vipLevel, vipTime, player]);
        break;
      default:
        throw new Error('Aksi tidak dikenali.');
    }

  } catch (err) {
    console.error(err);
    message = `❌ Gagal: ${err.message}`;
  }

  res.render('aksi-admin', {
    title: 'Aksi Admin',
    user: req.user,
    message
  });
});

module.exports = router;