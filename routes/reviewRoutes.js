const reviewModel = require('../models/reviewModel');

async function reviewRoutes(fastify, options) {
  // Hämta alla recensioner för en bok
  fastify.get('/books/:isbn/reviews', async (request, reply) => {
    const { isbn } = request.params;

    try {
      const reviews = await reviewModel.getReviewsForBook(fastify.mysql, isbn);
      reply.send(reviews);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

// Lägg till en recension
fastify.post('/books/:isbn/reviews', async (request, reply) => {
  const { isbn } = request.params;
  const { rating, review_text } = request.body;
  const user_id = request.user.id; // Hämta `user_id` från token

  if (!user_id || !rating || rating < 1 || rating > 5 || !review_text) {
    return reply.code(400).send({ error: 'rating (1-5) and review_text are required.' });
  }

  try {
    await reviewModel.addReview(fastify.mysql, { user_id, book_isbn: isbn, rating, review_text });
    reply.send({ message: 'Review added successfully' });
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
});

fastify.delete('/reviews/:id', async (request, reply) => { // Ta bort en recension
  const { id } = request.params;
  const { user_id } = request.body;

  if (!user_id) {
    return reply.code(400).send({ error: 'user_id is required.' });
  }

  try {
    const success = await reviewModel.deleteReview(fastify.mysql, id, user_id);
    if (success) {
      reply.send({ message: 'Review deleted successfully' });
    } else {
      reply.code(403).send({ error: 'Not authorized to delete this review' });
    }
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
});

}

module.exports = reviewRoutes;
