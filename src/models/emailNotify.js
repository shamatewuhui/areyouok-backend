const pool = require('../config/database');

class EmailNotify {
  /**
   * 创建邮件通知记录
   */
  static async create(userId, email, notifyType, notifyDate, sendStatus = 0) {
    const [result] = await pool.execute(
      `INSERT INTO T_EMAIL_NOTIFY (USER_ID, EMAIL, NOTIFY_TYPE, NOTIFY_DATE, SEND_STATUS, NOTIFY_TIME, CREATE_TIME)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, email, notifyType, notifyDate, sendStatus]
    );
    return result.insertId;
  }

  /**
   * 更新邮件发送状态
   */
  static async updateStatus(notifyId, sendStatus, errorMsg = null) {
    await pool.execute(
      `UPDATE T_EMAIL_NOTIFY 
       SET SEND_STATUS = ?, 
           ERROR_MSG = ?,
           NOTIFY_TIME = NOW()
       WHERE ID = ?`,
      [sendStatus, errorMsg, notifyId]
    );
  }
}

module.exports = EmailNotify;
