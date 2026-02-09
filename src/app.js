const express = require('express');
const cors = require('cors');
require('dotenv').config();

const signRoutes = require('./routes/sign');
const userRoutes = require('./routes/user');
const { startEmailReminderJob } = require('./jobs/emailReminder');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置 - 支持微信小程序
app.use(cors({
  origin: '*', // 允许所有来源（生产环境建议配置具体域名）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// 处理预检请求
app.options('*', cors());

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  next();
});

// 路由
app.use('/api/sign', signRoutes);
app.use('/api/user', userRoutes);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  console.error('错误堆栈:', err.stack);
  res.status(500).json({ code: 5001, message: '服务器内部错误', data: null });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 启动邮件提醒定时任务
  startEmailReminderJob();
});

module.exports = app;
