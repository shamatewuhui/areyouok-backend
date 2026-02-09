const pool = require('../config/database');

class SignRecord {
  /**
   * 检查用户今日是否已签到
   */
  static async hasSignedToday(userId) {
    const [rows] = await pool.execute(
      'SELECT ID FROM T_SIGN_RECORD WHERE USER_ID = ? AND SIGN_DATE = CURDATE() LIMIT 1',
      [userId]
    );
    return rows.length > 0;
  }

  /**
   * 创建签到记录
   */
  static async create(userId, signDate, signTime) {
    const [result] = await pool.execute(
      `INSERT INTO T_SIGN_RECORD (USER_ID, SIGN_DATE, SIGN_TIME, CREATE_TIME)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE SIGN_TIME = ?`,
      [userId, signDate, signTime, signTime]
    );
    return result.insertId;
  }

  /**
   * 获取用户签到记录
   */
  static async findByUserId(userId, startDate, endDate, page = 1, pageSize = 30) {
    const offset = (page - 1) * pageSize;
    let query = 'SELECT SIGN_DATE, SIGN_TIME FROM T_SIGN_RECORD WHERE USER_ID = ?';
    const params = [userId];

    if (startDate) {
      query += ' AND SIGN_DATE >= ?';
      params.push(startDate);
    } else {
      // 默认查询最近30天
      query += ' AND SIGN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    if (endDate) {
      query += ' AND SIGN_DATE <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY SIGN_DATE DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * 获取用户签到记录总数
   */
  static async countByUserId(userId, startDate, endDate) {
    let query = 'SELECT COUNT(*) as total FROM T_SIGN_RECORD WHERE USER_ID = ?';
    const params = [userId];

    if (startDate) {
      query += ' AND SIGN_DATE >= ?';
      params.push(startDate);
    } else {
      query += ' AND SIGN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    if (endDate) {
      query += ' AND SIGN_DATE <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  }
}

module.exports = SignRecord;
