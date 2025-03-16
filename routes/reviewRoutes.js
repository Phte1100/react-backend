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
    fastify.post('/books/:isbn/reviews', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { isbn } = request.params;
        const { rating, review_text } = request.body;
        const user_id = request.user.id;

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

    // Uppdatera en recension
    fastify.put('/reviews/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { rating, review_text } = request.body;
        const user_id = request.user.id;

        if (!user_id || !rating || rating < 1 || rating > 5 || !review_text) {
            return reply.code(400).send({ error: 'rating (1-5) and review_text are required.' });
        }

        try {
            const success = await reviewModel.updateReview(fastify.mysql, id, user_id, rating, review_text);
            if (success) {
                reply.send({ message: 'Review updated successfully' });
            } else {
                reply.code(403).send({ error: 'Not authorized to update this review' });
            }
        } catch (err) {
            reply.code(500).send({ error: err.message });
        }
    });

    // Ta bort en recension (admin kan ta bort alla)
    fastify.delete('/reviews/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const user_id = request.user.id;
        const user_role = request.user.role;

        try {
            const success = await reviewModel.deleteReview(fastify.mysql, id, user_id, user_role);
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
