const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { username, email, password, fullName } = userData;
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const sql = `
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await db.run(sql, [username, email, passwordHash, fullName]);
    return result.id;
  }

  // Find user by username or email
  static async findByLogin(login) {
    const sql = `
      SELECT * FROM users 
      WHERE (username = ? OR email = ?) AND is_active = 1
    `;
    return await db.get(sql, [login, login]);
  }

  // Find user by ID
  static async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ? AND is_active = 1`;
    return await db.get(sql, [id]);
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ? AND is_active = 1`;
    return await db.get(sql, [email]);
  }

  // Find user by username
  static async findByUsername(username) {
    const sql = `SELECT * FROM users WHERE username = ? AND is_active = 1`;
    return await db.get(sql, [username]);
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(userId) {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return await db.run(sql, [userId]);
  }

  // Generate password reset token
  static async generateResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY || 30) * 60 * 1000);

    const sql = `
      UPDATE users 
      SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.run(sql, [resetToken, expiresAt.toISOString(), user.id]);
    return { resetToken, user };
  }

  // Verify reset token
  static async verifyResetToken(token) {
    const sql = `
      SELECT * FROM users 
      WHERE reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP AND is_active = 1
    `;
    return await db.get(sql, [token]);
  }

  // Reset password
  static async resetPassword(token, newPassword) {
    const user = await this.verifyResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const sql = `
      UPDATE users 
      SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.run(sql, [passwordHash, user.id]);
    return user;
  }

  // Change password (for logged in users)
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const sql = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.run(sql, [passwordHash, userId]);
    return user;
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const { fullName, email } = updateData;
    
    const sql = `
      UPDATE users 
      SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return await db.run(sql, [fullName, email, userId]);
  }

  // Deactivate user account
  static async deactivateAccount(userId) {
    const sql = `
      UPDATE users 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return await db.run(sql, [userId]);
  }

  // Get user stats
  static async getUserStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as recent_logins
      FROM users
    `;
    
    return await db.get(sql);
  }
}

module.exports = User;
