module.exports = async function authMiddleware(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      const path = request.url;
      const method = request.method;
  
      // Tillåt vissa routes utan autentisering
      if (
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        (path.startsWith('/users') && method === 'POST') ||
        (path.startsWith('/books') && method === 'GET') 
      ) {
        return;
      }
  
      try {
        await request.jwtVerify(); //Verifiera token
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    });
  };
  