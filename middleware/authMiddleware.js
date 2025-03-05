module.exports = async function authMiddleware(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      const path = request.url; // Använd `url` istället för `routerPath`
      if (
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        (path.startsWith('/users') && request.method === 'POST')
      ) {
        return; // Tillåt åtkomst utan autentisering
      }
  
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    });
  };
  
  