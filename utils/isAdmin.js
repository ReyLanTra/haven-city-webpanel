module.exports = function isAdmin(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/auth/login');
};