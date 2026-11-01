module.exports = {
  secret: process.env.JWT_SECRET || 'campus_secret_jwt_key_2026_antigravity',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
