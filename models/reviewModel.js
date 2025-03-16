module.exports = {
  // Hämta recensioner för en bok (inkluderar användarnamn)
  async getReviewsForBook(db, isbn) {
      const [rows] = await db.query(
          `SELECT reviews.*, users.username 
           FROM reviews 
           JOIN users ON reviews.user_id = users.id 
           WHERE book_isbn = ? 
           ORDER BY created_at DESC`, 
          [isbn]
      );
      return rows;
  },

  // Lägg till en recension
  async addReview(db, review) {
      const { user_id, book_isbn, rating, review_text } = review;

      await db.query(
          `INSERT INTO reviews (user_id, book_isbn, rating, review_text) 
           VALUES (?, ?, ?, ?)`,
          [user_id, book_isbn, rating, review_text]
      );
  },

  // Uppdatera en recension
  async updateReview(db, reviewId, userId, rating, review_text) {
      const [result] = await db.query(
          `UPDATE reviews SET rating = ?, review_text = ? WHERE id = ? AND user_id = ?`,
          [rating, review_text, reviewId, userId]
      );
      return result.affectedRows > 0;
  },

  // Ta bort en recension (admin kan ta bort alla)
  async deleteReview(db, reviewId, userId, userRole) {
      if (userRole === "admin") {
          const [result] = await db.query(`DELETE FROM reviews WHERE id = ?`, [reviewId]);
          return result.affectedRows > 0;
      } else {
          const [result] = await db.query(`DELETE FROM reviews WHERE id = ? AND user_id = ?`, [reviewId, userId]);
          return result.affectedRows > 0;
      }
  }
};
