const { sendEmail } = require('../config/email');
require('dotenv').config();

/**
 * 测试邮件发送功能
 */
async function testEmailFunction() {
  console.log('========== 开始测试邮件发送功能 ==========\n');

  // 从环境变量读取配置
  const testEmail = process.env.EMAIL_USER;
  const testSubject = '【君安否】邮件功能测试';
  const testContent = `
这是一封测试邮件,用于验证邮件发送功能是否正常。

测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

如果您收到这封邮件,说明邮件发送功能配置正确!

---
君安否团队
  `.trim();

  console.log('测试配置信息:');
  console.log(`- SMTP服务器: ${process.env.EMAIL_HOST}`);
  console.log(`- SMTP端口: ${process.env.EMAIL_PORT}`);
  console.log(`- 发件邮箱: ${process.env.EMAIL_USER}`);
  console.log(`- 收件邮箱: ${testEmail}`);
  console.log(`- 邮件主题: ${testSubject}`);
  console.log('\n正在发送测试邮件...\n');

  try {
    // 发送测试邮件
    const result = await sendEmail(testEmail, testSubject, testContent);

    if (result.success) {
      console.log('✅ 测试成功!');
      console.log(`   邮件ID: ${result.messageId}`);
      console.log(`\n请检查邮箱 ${testEmail} 是否收到测试邮件`);
      console.log('(注意: 可能需要等待几秒钟,并检查垃圾邮件文件夹)\n');
    } else {
      console.error('❌ 测试失败!');
      console.error(`   错误信息: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试过程中发生异常:');
    console.error(error);
    process.exit(1);
  }

  console.log('========== 邮件发送功能测试完成 ==========');
  process.exit(0);
}

// 执行测试
testEmailFunction();
