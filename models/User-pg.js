const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database-pg');

class User {
  // Create a new user
  static async create({ username, email, password, fullName }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hashedPassword, fullName]
    );
    
    return result.rows[0].id;
  }

  // Find user by ID
  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Find user by username or email (for login)
  static async findByLogin(login) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [login]
    );
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Update last login timestamp
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Generate password reset token
  static async generateResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    return { resetToken, user };
  }

  // Reset password using token
  static async resetPassword(token, newPassword) {
    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > $2',
      [token, Date.now()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const user = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
  }

  // Change password (for logged in users)
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  }

  // Get all users (admin only)
  static async getAll() {
    const result = await pool.query('SELECT id, username, email, full_name, role, created_at, last_login FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  // Update user role (admin only)
  static async updateRole(userId, role) {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
  }

  // Delete user (admin only)
  static async delete(userId) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

module.exports = User;
