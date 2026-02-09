const pool = require('../config/database');

class User {
  /**
   * 根据 openid 查询用户
   */
  static async findByOpenid(openid) {
    const [rows] = await pool.execute(
      'SELECT * FROM T_USER WHERE OPENID = ? AND DELETE_FLAG = 0 LIMIT 1',
      [openid]
    );
    return rows[0] || null;
  }

  /**
   * 根据 email 查询用户
   */
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM T_USER WHERE EMAIL = ? AND DELETE_FLAG = 0 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * 根据 ID 查询用户
   */
  static async findById(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM T_USER WHERE ID = ? AND DELETE_FLAG = 0 LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  /**
   * 创建用户
   */
  static async create(userData) {
    const { openid, nickname, email } = userData;
    const [result] = await pool.execute(
      `INSERT INTO T_USER (OPENID, NICKNAME, EMAIL, EMAIL_VERIFIED, STATUS, DELETE_FLAG, CREATE_TIME, UPDATE_TIME)
       VALUES (?, ?, ?, 0, 1, 0, NOW(), NOW())`,
      [openid || null, nickname || null, email]
    );
    return result.insertId;
  }

  /**
   * 更新用户信息
   */
  static async update(userId, updateData) {
    const fields = [];
    const values = [];

    if (updateData.nickname !== undefined) {
      fields.push('NICKNAME = ?');
      values.push(updateData.nickname);
    }
    if (updateData.email !== undefined) {
      fields.push('EMAIL = ?');
      values.push(updateData.email);
    }
    if (updateData.openid !== undefined) {
      fields.push('OPENID = ?');
      values.push(updateData.openid);
    }

    if (fields.length === 0) return;

    fields.push('UPDATE_TIME = NOW()');
    values.push(userId);

    await pool.execute(
      `UPDATE T_USER SET ${fields.join(', ')} WHERE ID = ?`,
      values
    );
  }

  /**
   * 更新用户签到统计
   */
  static async updateSignStats(userId, lastSignTime, continuousDays, totalSignDays) {
    await pool.execute(
      `UPDATE T_USER 
       SET LAST_SIGN_TIME = ?,
           CONTINUOUS_DAYS = ?,
           TOTAL_SIGN_DAYS = ?,
           UPDATE_TIME = NOW()
       WHERE ID = ?`,
      [lastSignTime, continuousDays, totalSignDays, userId]
    );
  }

  /**
   * 查询需要发送邮件提醒的用户（连续两天未签到）
   */
  static async findUsersNeedReminder(targetDate) {
    const [rows] = await pool.execute(
      `SELECT u.ID, u.OPENID, u.EMAIL, u.LAST_SIGN_TIME
       FROM T_USER u
       WHERE u.STATUS = 1 
         AND u.DELETE_FLAG = 0
         AND u.EMAIL_VERIFIED = 1
         AND (
           u.LAST_SIGN_TIME IS NULL 
           OR DATE(u.LAST_SIGN_TIME) < DATE_SUB(?, INTERVAL 1 DAY)
         )
         AND NOT EXISTS (
           SELECT 1 
           FROM T_EMAIL_NOTIFY en 
           WHERE en.USER_ID = u.ID 
             AND en.NOTIFY_TYPE = 1 
             AND en.NOTIFY_DATE = DATE_SUB(?, INTERVAL 1 DAY)
             AND en.SEND_STATUS = 1
         )`,
      [targetDate, targetDate]
    );
    return rows;
  }
}

module.exports = User;
