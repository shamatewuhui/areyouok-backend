const nodemailer = require('nodemailer');
require('dotenv').config();

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 验证邮件配置
transporter.verify((error, success) => {
  if (error) {
    console.error('邮件服务配置错误:', error);
  } else {
    console.log('邮件服务配置成功');
  }
});

/**
 * 发送邮件
 * @param {string} to - 接收邮箱
 * @param {string} subject - 邮件主题
 * @param {string} text - 邮件内容
 * @returns {Promise}
 */
async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text
    });
    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  transporter
};
