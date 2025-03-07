const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
dotenv.config();

console.log('JWT secret:', process.env.JWT_SECRET);
console.log('Database URL:', process.env.DATABASE_URL);

// Registrera CORS-plugin med den senaste versionens syntax
fastify.register(require('@fastify/cors'), {
  origin: '*', // Tillåt alla domäner
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specifika HTTP-metoder
});

// Registrera JWT-plugin
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET
});

// Registrera MySQL-plugin
fastify.register(require('@fastify/mysql'), {
  promise: true,
  connectionString: process.env.DATABASE_URL
});

// Registrera middleware
const authMiddleware = require('./middleware/authMiddleware');
authMiddleware(fastify);

// Registrera routes
fastify.register(require('./routes/authRoutes'));
fastify.register(require('./routes/userRoutes'));
fastify.register(require('./routes/bookRoutes'));
fastify.register(require('./routes/reviewRoutes'));

// Starta servern
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://0.0.0.0:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
