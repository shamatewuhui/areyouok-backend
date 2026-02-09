const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * 初始化数据库脚本
 * 执行数据库初始化SQL文件
 */
async function initDatabase() {
  let connection;
  
  try {
    // 创建数据库连接（不指定数据库，因为数据库可能还不存在）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true // 允许执行多条SQL语句
    });

    console.log('数据库连接成功');

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '../../项目文件/数据库初始化脚本.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('开始执行数据库初始化脚本...');

    // 执行SQL脚本
    await connection.query(sql);

    console.log('数据库初始化完成！');
    console.log('数据库名:', process.env.DB_NAME);
    console.log('表结构已创建：');
    console.log('  - T_USER (用户表)');
    console.log('  - T_SIGN_RECORD (签到记录表)');
    console.log('  - T_EMAIL_NOTIFY (邮件通知记录表)');

  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ER_DB_CREATE_EXISTS') {
      console.log('\n数据库已存在，继续执行表创建...');
      // 如果数据库已存在，尝试连接数据库并执行表创建
      try {
        await connection.end();
        connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          multipleStatements: true
        });
        
        // 只执行表创建的SQL（跳过CREATE DATABASE）
        const sqlFilePath = path.join(__dirname, '../../项目文件/数据库初始化脚本.sql');
        let sql = fs.readFileSync(sqlFilePath, 'utf8');
        // 移除 CREATE DATABASE 语句
        sql = sql.replace(/CREATE DATABASE[^;]+;/gi, '');
        sql = sql.replace(/USE[^;]+;/gi, '');
        
        await connection.query(sql);
        console.log('表结构创建完成！');
      } catch (err) {
        console.error('创建表结构失败:', err.message);
        console.error('\n提示：如果数据库在 Kubernetes 集群中，可能需要：');
        console.error('1. 通过 kubectl 在集群内执行初始化脚本');
        console.error('2. 或者使用数据库管理工具（如 DBeaver、Navicat）连接数据库并执行SQL');
        console.error('3. 或者确认数据库是否已经初始化完成');
        process.exit(1);
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'EPERM') {
      console.error('\n无法连接到数据库服务器！');
      console.error('可能的原因：');
      console.error('1. 数据库服务器在 Kubernetes 集群中，当前环境无法直接访问');
      console.error('2. 网络连接问题');
      console.error('3. 数据库服务未启动');
      console.error('\n解决方案：');
      console.error('1. 如果数据库在 Kubernetes 集群中，请通过 kubectl 执行：');
      console.error('   kubectl exec -it <mysql-pod-name> -- mysql -u root -p4prw5sqx < 项目文件/数据库初始化脚本.sql');
      console.error('2. 或者使用数据库管理工具连接数据库并执行SQL文件');
      console.error('3. 或者确认数据库是否已经初始化完成（可以尝试启动应用测试连接）');
      process.exit(1);
    } else {
      console.error('\n其他错误，请检查：');
      console.error('1. 数据库配置是否正确（.env 文件）');
      console.error('2. 数据库服务是否正常运行');
      console.error('3. 网络连接是否正常');
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行初始化
initDatabase();
