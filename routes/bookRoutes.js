const https = require('https');

// Funktion för att hämta bokdata från Google Books API baserat på ISBN

// Returnerar en promise med data från API:et
async function fetchBookData(isbn, apiKey) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      // När all data är mottagen
      res.on('end', () => {
        resolve(JSON.parse(data)); // Parsar och returnerar datan som JSON
      });
    }).on('error', (err) => {
      reject(err); // Hanterar fel vid API-anropet
    });
  });
}

// Funktion som definierar alla bokrelaterade routes
async function bookRoutes(fastify, options) {
  // Route för att lägga till en ny bok
  fastify.post('/add-book', async (request, reply) => {
    const { isbn, stock, type } = request.body;

    // Validering av inmatad data
    if (!isbn || !stock || !type || (type !== 'hardcover' && type !== 'paperback' && type !== 'ebook'))
    {
      return reply.code(400).send({ error: 'ISBN, stock, and type are required. Type must be "hardcover" or "paperback".' });
    }

    try {
      // Hämta API-nyckel från miljövariabler
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

      // Hämta bokdata från Google Books API
      const data = await fetchBookData(isbn, apiKey);

      if (!data.items || data.items.length === 0) {
        return reply.code(404).send({ error: 'Book not found in Google Books API' });
      }

      // Extrahera relevant bokinformation
      const book = data.items[0].volumeInfo;
      const title = book.title;
      const author = book.authors ? book.authors.join(', ') : 'Unknown';
      const publishedYear = book.publishedDate ? book.publishedDate.split('-')[0] : 'Unknown';
      const thumbnail = book.imageLinks?.thumbnail || null;
      const genre = book.categories ? book.categories.join(', ') : 'Unknown';

      // Välj tabell baserat på boktyp
      // Välj tabell baserat på boktyp
      const table = type === 'hardcover' ? 'hardcover_books' 
      : type === 'paperback' ? 'paperback_books' 
      : 'ebook_books';


      // Kontrollera om boken redan finns i databasen
      const [existingBook] = await fastify.mysql.query(
        `SELECT * FROM ${table} WHERE isbn = ?`,
        [isbn]
      );

      if (existingBook.length > 0) {
        return reply.code(400).send({ error: 'Book already exists' });
      }

      // Lägg till boken i databasen
      await fastify.mysql.query(
        `INSERT INTO ${table} (isbn, title, author, published_year, stock, thumbnail, genre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [isbn, title, author, publishedYear, stock, thumbnail, genre]
    );
      reply.send({ message: 'Book added successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Route för att uppdatera lagersaldo
  fastify.put('/update-book', async (request, reply) => {
    const { isbn, stock, type, title, author } = request.body;
  
    if (!isbn || stock === undefined || !type || (type !== 'hardcover' && type !== 'paperback' && type !== 'ebook') || !title || !author) {
      return reply.code(400).send({ error: 'ISBN, stock, title, author, and type are required. Type must be "hardcover" or "paperback".' });
    }
  
    try {
      // Välj tabell baserat på boktyp
      const table = type === 'hardcover' ? 'hardcover_books' 
      : type === 'paperback' ? 'paperback_books' 
      : 'ebook_books';

  
      // Kontrollera om boken finns
      const [existingBook] = await fastify.mysql.query(
        `SELECT * FROM ${table} WHERE isbn = ?`,
        [isbn]
      );
  
      if (existingBook.length === 0) {
        return reply.code(404).send({ error: 'Book not found' });
      }
  
      // Uppdatera boken i databasen
      await fastify.mysql.query(
        `UPDATE ${table} SET stock = ?, title = ?, author = ? WHERE isbn = ?`,
        [stock, title, author, isbn]
      );
  
      reply.send({ message: 'Book updated successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });  

  // Route för att hämta alla böcker
  fastify.get('/books', async (request, reply) => {
    try {
        // Hämta böcker från alla tre tabeller
        const [books] = await fastify.mysql.query(`
            SELECT *, 'hardcover' AS type FROM hardcover_books
            UNION
            SELECT *, 'paperback' AS type FROM paperback_books
            UNION
            SELECT *, 'ebook' AS type FROM ebook_books
        `);
        reply.send(books);
    } catch (err) {
        reply.code(500).send({ error: err.message });
    }
  });

  // Route för att hämta en specifik bok
  fastify.get('/books/:type/:isbn', async (request, reply) => {
    const { type, isbn } = request.params;
    const table = type === 'hardcover' ? 'hardcover_books' 
            : type === 'paperback' ? 'paperback_books' 
            : 'ebook_books';

    try {
      // Hämta bok baserat på typ och ISBN
      const [book] = await fastify.mysql.query(`SELECT * FROM ${table} WHERE isbn = ?`, [isbn]);
      if (!book.length) {
        return reply.code(404).send({ error: 'Book not found' });
      }
      reply.send(book[0]);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Route för att ta bort en bok
  fastify.delete('/books/:type/:isbn', async (request, reply) => {
    const { type, isbn } = request.params;
    const table = type === 'hardcover' ? 'hardcover_books' 
            : type === 'paperback' ? 'paperback_books' 
            : 'ebook_books';

    try {
      // Ta bort bok från databasen
      const [result] = await fastify.mysql.query(`DELETE FROM ${table} WHERE isbn = ?`, [isbn]);
      if (result.affectedRows === 0) {
        return reply.code(404).send({ error: 'Book not found' });
      }
      reply.send({ message: 'Book deleted successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = bookRoutes;
