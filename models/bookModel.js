module.exports = {
  // Hämta ALLA böcker
  // Hämta alla böcker och inkludera om användaren har gillat dem
  async getAllBooks(db, userId) {
    const [books] = await db.query(`SELECT * FROM books`);

    // För varje bok, kolla om användaren har gillat den
    for (let book of books) {
      const [likes] = await db.query(`SELECT 1 FROM likes WHERE user_id = ? AND book_isbn = ?`, [userId, book.isbn]);
      book.userHasLiked = likes.length > 0; // true om gillad, annars false
    }

    return books;
  },

  // Kontrollera om användaren har gillat en bok
  async hasLikedBook(db, userId, isbn) {
    const [rows] = await db.query(`SELECT * FROM likes WHERE user_id = ? AND book_isbn = ?`, [userId, isbn]);
    return rows.length > 0;
  },

  // Lägg till eller ta bort en gillning (toggle)
  async toggleLikeBook(db, userId, isbn) {
    const hasLiked = await this.hasLikedBook(db, userId, isbn);

    if (hasLiked) {
      // Om användaren redan har gillat, ta bort gillningen
      await db.query(`DELETE FROM likes WHERE user_id = ? AND book_isbn = ?`, [userId, isbn]);
      await db.query(`UPDATE books SET likes = likes - 1 WHERE isbn = ?`, [isbn]);
      return { liked: false };
    } else {
      // Annars, lägg till gillningen
      await db.query(`INSERT INTO likes (user_id, book_isbn) VALUES (?, ?)`, [userId, isbn]);
      await db.query(`UPDATE books SET likes = likes + 1 WHERE isbn = ?`, [isbn]);
      return { liked: true };
    }
  },

  // Hämta EN bok via ISBN
  async getBookByISBN(db, isbn) {
    const [rows] = await db.query(`SELECT * FROM books WHERE isbn = ?`, [isbn]);
    return rows.length > 0 ? rows[0] : null; // Returnera null om ingen bok hittas
  },

  // Lägg till en ny bok i databasen
  async addBook(db, book) {
    const { isbn, title, author, publishedYear, description, excerpt, thumbnail, genre, format } = book;

    await db.query(
      `INSERT INTO books (isbn, title, author, published_year, description, excerpt, thumbnail, genre, format) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, author, publishedYear, description, excerpt, thumbnail, genre, format]
    );
  },

  // Uppdatera en bok (t.ex. titel, beskrivning, genre, etc.)
  async updateBook(db, isbn, updates) {
    const fields = [];
    const values = [];

    // Lägg till endast de fält som finns i `updates`
    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    if (fields.length === 0) return false; // Inga uppdateringar att göra

    values.push(isbn); // Lägg till ISBN i slutet för WHERE-villkoret

    const query = `UPDATE books SET ${fields.join(', ')} WHERE isbn = ?`;
    const [result] = await db.query(query, values);
    
    return result.affectedRows > 0; // Returnera true om en bok har uppdaterats
  },

  // Öka antal likes på en bok
  async likeBook(db, isbn) {
    const [result] = await db.query(`UPDATE books SET likes = likes + 1 WHERE isbn = ?`, [isbn]);
    return result.affectedRows > 0; // Returnera true om en bok har uppdaterats
  },

  // Kontrollera om användaren har gillat en bok
  async hasLikedBook(db, userId, isbn) {
    const [rows] = await db.query(`SELECT * FROM likes WHERE user_id = ? AND book_isbn = ?`, [userId, isbn]);
    return rows.length > 0;
  },

  // Lägg till eller ta bort en gillning (toggle)
  async toggleLikeBook(db, userId, isbn) {
    const hasLiked = await this.hasLikedBook(db, userId, isbn);

    if (hasLiked) {
      // Om användaren redan har gillat, ta bort gillningen
      await db.query(`DELETE FROM likes WHERE user_id = ? AND book_isbn = ?`, [userId, isbn]);
      await db.query(`UPDATE books SET likes = likes - 1 WHERE isbn = ?`, [isbn]);
      return { liked: false };
    } else {
      // Annars, lägg till gillningen
      await db.query(`INSERT INTO likes (user_id, book_isbn) VALUES (?, ?)`, [userId, isbn]);
      await db.query(`UPDATE books SET likes = likes + 1 WHERE isbn = ?`, [isbn]);
      return { liked: true };
    }
  },

  // Ta bort en bok från databasen
  async deleteBook(db, isbn) {
    const [result] = await db.query(`DELETE FROM books WHERE isbn = ?`, [isbn]);
    return result.affectedRows > 0; // Returnera true om en bok har tagits bort
  }

  
};
