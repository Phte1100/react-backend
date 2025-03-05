const bcrypt = require('bcrypt');

module.exports = {
  // Skapa en ny användare
  async createUser(db, username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    return result.insertId; // Returnerar det nya användar-ID:t
  },

  // Hämta användare baserat på användarnamn
  async getUserByUsername(db, username) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  },

  // Hämta användare baserat på ID
  async getUserById(db, id) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Verifiera lösenord
  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }
};
