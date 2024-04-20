const { Pool } = require("pg");

const pool = new Pool({
  user: "apple",
  host: "localhost",
  database: "twitter_db",
  password: "resilience",
  port: 5432,
});

const Post = {
  // Define a method for finding all posts
  // Use the Pool instance to execute a SQL query to find all posts
  // Return the resulting rows as an array

  async findAll() {
    const result = await pool.query("SELECT * FROM posts");
    return result.rows;
  },

  // Define a method for finding a post by its ID
  // Use the Pool instance to execute a SQL query to find a post by its ID
  // Return the resulting row as an object

  async findById(id) {
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    return result.rows[0];
  },

  // Define a method for creating a new post
  // Use the Pool instance to execute a SQL query to insert a new post into the database
  // Return the resulting row as an object

  async create({ text, image }) {
    const result = await pool.query(
      "INSERT INTO posts (text, image) VALUES ($1, $2) RETURNING *",
      [text, image]
    );
    return result.rows[0];
  },

  // Define a method for updating an existing post
  // Use the Pool instance to execute a SQL query to update a post in the database
  // Return the resulting row as an object

  async update(id, { text, image }) {
    const result = await pool.query(
      "UPDATE posts SET text = $1, image = $2 WHERE id = $3 RETURNING *",
      [text, image, id]
    );
    return result.rows[0];
  },

  // Define a method for deleting a post
  // Use the Pool instance to execute a SQL query to delete a post from the database
  // Return the resulting row as an object

  async delete(id) {
    const result = await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    return result.rows[0];
  },

  //Define a method for finding all posts with pagination
  // Use the Pool instance to execute a SQL query to find all posts with pagination
  // Return the resulting rows as an array and the total number of rows

  async findAndCountAll({ page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const result = await pool.query("SELECT * FROM posts LIMIT $1 OFFSET $2", [
      limit,
      offset,
    ]);
    const countResult = await pool.query("SELECT COUNT(*) FROM posts");
    const count = countResult.rows[0].count;
    return { rows: result.rows, count };
  },
};

module.exports = Post;
