const https = require('https');
const bookModel = require('../models/bookModel'); // Importera modellen

async function fetchBookData(isbn, apiKey) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error("Failed to parse Google Books API response"));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function bookRoutes(fastify, options) {
  // Hämta alla böcker (tillgängligt för alla)
  /*fastify.get('/books', async (request, reply) => {
    try {
      const books = await bookModel.getAllBooks(fastify.mysql);
      reply.send(books);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });*/
  fastify.get('/books', async (request, reply) => {
    try {
      const userId = request.user?.id || null; // Om användaren är inloggad, använd deras ID
      const books = await bookModel.getAllBooks(fastify.mysql, userId);
      reply.send(books);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Hämta en specifik bok via ISBN
  fastify.get('/books/:isbn', async (request, reply) => {
    const { isbn } = request.params;

    try {
      const book = await bookModel.getBookByISBN(fastify.mysql, isbn);

      if (!book) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      reply.send(book);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Uppdatera en bok
  fastify.put('/books/:isbn', async (request, reply) => {
    const { isbn } = request.params;
    const updates = request.body; // Fält att uppdatera

    try {
      const success = await bookModel.updateBook(fastify.mysql, isbn, updates);

      if (!success) {
        return reply.code(404).send({ error: 'Book not found or no changes made' });
      }

      reply.send({ message: 'Book updated successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Ta bort en bok
  fastify.delete('/books/:isbn', async (request, reply) => {
    const { isbn } = request.params;

    try {
      const success = await bookModel.deleteBook(fastify.mysql, isbn);

      if (!success) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      reply.send({ message: 'Book deleted successfully' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Gilla en bok
  /*fastify.post('/books/:isbn/like', async (request, reply) => {
    const { isbn } = request.params;

    try {
      const success = await bookModel.likeBook(fastify.mysql, isbn);

      if (!success) {
        return reply.code(404).send({ error: 'Book not found' });
      }

      reply.send({ message: 'Book liked!' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });*/

  // Gilla eller ta bort gilla
  fastify.post('/books/:isbn/like', async (request, reply) => {
    const { isbn } = request.params;
    const userId = request.user.id; // Kräver autentisering

    try {
      const result = await bookModel.toggleLikeBook(fastify.mysql, userId, isbn);
      reply.send({ message: result.liked ? 'Book liked!' : 'Like removed!' });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
  

  fastify.post('/books', async (request, reply) => {
    const { isbn, format } = request.body;
  
    if (!isbn || !format) {
      return reply.code(400).send({ error: 'ISBN and format are required.' });
    }
  
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const data = await fetchBookData(isbn, apiKey);
  
      if (!data.items || data.items.length === 0) {
        return reply.code(404).send({ error: 'Book not found in Google Books API' });
      }
  
      const book = data.items[0].volumeInfo;

      console.log("Google Books API response:", book);

      const bookData = {
        isbn,
        title: book.title,
        author: book.authors ? book.authors.join(', ') : 'Unknown',
        publishedYear: book.publishedDate ? book.publishedDate.split('-')[0] : 'Unknown', 
        publishedDate: book.publishedDate || "Unknown",
        description: book.description || 'No description available',
        excerpt: book.searchInfo?.textSnippet || 'No excerpt available',
        thumbnail: book.imageLinks?.thumbnail || null,
        genre: book.categories ? book.categories.join(', ') : 'Unknown',
        format
    };

      console.log("Book data to save:", bookData);
  
      await bookModel.addBook(fastify.mysql, bookData);
      reply.send({ message: 'Book added successfully', book: bookData });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

}

module.exports = bookRoutes;

