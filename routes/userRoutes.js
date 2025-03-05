const bcrypt = require('bcrypt');

async function userRoutes(fastify, options) {
  // Hämta alla användare
  fastify.get('/users', async (request, reply) => {
    try {
      const [users] = await fastify.mysql.query(
        'SELECT id, username, email, role, created_at FROM users'
      );
      reply.send(users);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Uppdatera en användare
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const { username, email, password } = request.body;

    try {
      // Validera lösenordets längd om det finns
      if (password && password.length < 6) {
        return reply.code(400).send({ error: 'Password must be at least 6 characters long.' });
      }

      // Hasha lösenord om det finns
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Bygg uppdateringsfrågan dynamiskt
      const fields = [];
      const values = [];

      if (username) {
        fields.push('username = ?');
        values.push(username);
      }
      if (email) {
        fields.push('email = ?');
        values.push(email);
      }
      if (hashedPassword) {
        fields.push('password_hash = ?');
        values.push(hashedPassword);
      }

      if (fields.length === 0) {
        return reply.code(400).send({ error: 'No fields to update' });
      }

      values.push(id);

      await fastify.mysql.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      reply.send({ message: 'User updated successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Ta bort en användare
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const [result] = await fastify.mysql.query('DELETE FROM users WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      reply.send({ message: 'User deleted successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Skapa en användare
  fastify.post('/users', async (request, reply) => {
    const { username, email, password, role } = request.body;

    // Kontrollera att alla fält finns
    if (!username || !email || !password || !role) {
      return reply.code(400).send({ error: 'All fields are required' });
    }

    // Validera lösenordets längd
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters long.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await fastify.mysql.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role]
      );

      reply.send({ message: 'User created successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = userRoutes;
