module.exports = {
    // Hämta recensioner för en bok
    async getReviewsForBook(db, isbn) {
      const [rows] = await db.query(`SELECT * FROM reviews WHERE book_isbn = ? ORDER BY created_at DESC`, [isbn]);
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
  
    // Gilla en recension
    async likeReview(db, reviewId) {
      await db.query(`UPDATE reviews SET likes = likes + 1 WHERE id = ?`, [reviewId]);
    },
  
    // Ta bort en recension
    async deleteReview(db, reviewId, userId) {
      const [result] = await db.query(`DELETE FROM reviews WHERE id = ? AND user_id = ?`, [reviewId, userId]);
      return result.affectedRows > 0;
    }
  };
  