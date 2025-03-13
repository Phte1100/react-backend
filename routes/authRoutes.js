const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function authRoutes(fastify, options) {
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    try {
      // Kontrollera om användaren finns
      const [rows] = await fastify.mysql.query('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length === 0) {
        return reply.code(401).send({ error: 'email is already in use' });
      }

      const user = rows[0];

      // Kontrollera lösenordet
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid password' });
      }

      // Skapa JWT-token
      const token = jwt.sign(
        { id: user.id, role: user.role, username: user.username }, // Payload
        process.env.JWT_SECRET, // Hemligt nyckel
        { expiresIn: '1h' } // Giltighetstid
      );

      // Returnera token och användarinformation
      reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
  fastify.get('/validate', async (request, reply) => {
    try {
        await request.jwtVerify();
        const userId = request.user.id;

        // Hämta hela användaren från databasen
        const [rows] = await fastify.mysql.query('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return reply.code(401).send({ valid: false, error: 'User not found' });
        }

        const user = rows[0];

        return reply.send({ valid: true, user });
    } catch (err) {
        return reply.code(401).send({ valid: false, error: 'Invalid token' });
    }
});

  

}

module.exports = authRoutes;
