const cron = require('node-cron');
const User = require('../models/user');
const EmailNotify = require('../models/emailNotify');
const { sendEmail } = require('../config/email');
require('dotenv').config();

/**
 * 发送邮件提醒任务
 * 检查连续两天未签到的用户，发送邮件提醒
 */
async function checkAndSendReminders() {
  try {
    console.log('开始执行邮件提醒任务...');
    const today = new Date();
    const targetDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // 查询需要发送提醒的用户
    const users = await User.findUsersNeedReminder(targetDate);
    console.log(`找到 ${users.length} 个需要发送提醒的用户`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // 创建邮件通知记录（待发送状态）
        const notifyId = await EmailNotify.create(
          user.ID,
          user.EMAIL,
          1, // NOTIFY_TYPE: 1-连续两天未签到提醒
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 昨天的日期
          0 // SEND_STATUS: 0-待发送
        );

        // 发送邮件
        const emailSubject = process.env.EMAIL_SUBJECT || '我连续2天都不好，快给我打个电话吧！';
        const emailContent = process.env.EMAIL_CONTENT || '我连续2天都不好，快给我打个电话吧！';

        const result = await sendEmail(user.EMAIL, emailSubject, emailContent);

        if (result.success) {
          // 更新为发送成功
          await EmailNotify.updateStatus(notifyId, 1); // 1-发送成功
          successCount++;
          console.log(`邮件发送成功: ${user.EMAIL}`);
        } else {
          // 更新为发送失败
          await EmailNotify.updateStatus(notifyId, 2, result.error); // 2-发送失败
          failCount++;
          console.error(`邮件发送失败: ${user.EMAIL}, 错误: ${result.error}`);
        }
      } catch (error) {
        failCount++;
        console.error(`处理用户 ${user.ID} 时出错:`, error);
      }
    }

    console.log(`邮件提醒任务完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);
  } catch (error) {
    console.error('邮件提醒任务执行失败:', error);
  }
}

/**
 * 启动定时任务
 */
function startEmailReminderJob() {
  // 从环境变量读取Cron表达式，默认每天凌晨1点执行
  const cronSchedule = process.env.CRON_SCHEDULE || '0 1 * * *';
  
  console.log(`邮件提醒定时任务已启动，执行时间: ${cronSchedule}`);

  // 立即执行一次（可选，用于测试）
  // checkAndSendReminders();

  // 设置定时任务
  cron.schedule(cronSchedule, () => {
    checkAndSendReminders();
  });
}

module.exports = {
  checkAndSendReminders,
  startEmailReminderJob
};
