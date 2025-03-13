module.exports = async function authMiddleware(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      const path = request.url;
      const method = request.method;
  
      // 🛠 Logga inkommande request
      console.log(`Incoming request: ${method} ${path}`);
      console.log("Headers:", request.headers);
  
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
        console.log("Token är giltig:", request.user);
      } catch (err) {
        console.error("Token ogiltig:", err.message);
        reply.code(401).send({ error: 'Unauthorized' });
      }
    });
  };
  