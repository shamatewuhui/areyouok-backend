# 君安否小程序后端服务

## 项目简介

君安否是一个微信小程序，主要功能是用户每日签到。如果用户连续两天未签到，系统会自动发送邮件提醒。

## 功能特性

- ✅ 用户每日签到功能
- ✅ 连续签到天数统计
- ✅ 累计签到天数统计
- ✅ 自动邮件提醒（连续两天未签到）
- ✅ 用户信息查询
- ✅ 签到记录查询

## 技术栈

- Node.js
- Express.js
- MySQL
- Nodemailer（邮件发送）
- node-cron（定时任务）

## 项目结构

```
.
├── src/
│   ├── app.js                 # 主应用入口
│   ├── config/                # 配置文件
│   │   ├── database.js        # 数据库配置
│   │   └── email.js           # 邮件服务配置
│   ├── controllers/           # 控制器
│   │   ├── signController.js # 签到相关控制器
│   │   └── userController.js # 用户相关控制器
│   ├── models/                # 数据模型
│   │   ├── user.js           # 用户模型
│   │   ├── signRecord.js    # 签到记录模型
│   │   └── emailNotify.js   # 邮件通知模型
│   ├── routes/                # 路由
│   │   ├── sign.js          # 签到路由
│   │   └── user.js          # 用户路由
│   ├── utils/                 # 工具函数
│   │   └── validator.js     # 参数验证工具
│   └── jobs/                  # 定时任务
│       └── emailReminder.js  # 邮件提醒任务
├── 项目文件/                   # 项目文档
│   ├── 数据库设计文档-君安否.md
│   ├── 数据库初始化脚本.sql
│   └── API接口需求文档-君安否.md
├── .env.example               # 环境变量示例
├── package.json              # 项目依赖
├── API接口文档.md            # API接口文档
├── 配置说明.md               # 配置说明文档
└── README.md                 # 项目说明

```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：
- 数据库配置（已根据您提供的信息配置）
- 邮件服务配置（**必须配置**，详见 `配置说明.md`）

### 3. 初始化数据库

执行数据库初始化脚本：

```bash
mysql -h areyouok-mysql-mysql.ns-smjizehq.svc -u root -p4prw5sqx < 项目文件/数据库初始化脚本.sql
```

或者使用MySQL客户端工具执行 `项目文件/数据库初始化脚本.sql` 文件。

### 4. 启动服务

**开发环境**：
```bash
npm run dev
```

**生产环境**：
```bash
npm start
```

服务默认运行在 `http://localhost:3000`

## API 接口

详细的API接口文档请参考：[API接口文档.md](./API接口文档.md)

### 主要接口

- `POST /api/sign` - 用户签到
- `GET /api/user/info` - 获取用户信息
- `GET /api/sign/records` - 获取签到记录
- `GET /health` - 健康检查

## 配置说明

详细的配置说明请参考：[配置说明.md](./配置说明.md)

### 重要配置项

1. **数据库配置**：已根据您提供的信息配置
2. **邮件服务配置**：需要配置SMTP服务（QQ邮箱、163邮箱、Gmail等）
3. **定时任务配置**：默认每天凌晨1点执行邮件提醒任务

## 邮件服务配置

**重要**：邮件服务配置是必须的，用于发送签到提醒邮件。

### 快速配置（QQ邮箱示例）

1. 登录QQ邮箱
2. 开启SMTP服务并获取授权码
3. 在 `.env` 文件中配置：

```env
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-qq@qq.com
EMAIL_PASSWORD=your-authorization-code
EMAIL_FROM=君安否 <your-qq@qq.com>
```

更多邮件服务商配置方法请参考：[配置说明.md](./配置说明.md)

## 定时任务

系统会自动在每天凌晨1点（可通过环境变量配置）检查连续两天未签到的用户，并发送邮件提醒。

邮件内容可通过环境变量配置：
```env
EMAIL_SUBJECT=我连续2天都不好，快给我打个电话吧！
EMAIL_CONTENT=我连续2天都不好，快给我打个电话吧！
```

## 开发说明

### 代码规范

- 使用 ES6+ 语法
- 使用 async/await 处理异步操作
- 使用参数化查询防止SQL注入
- 完善的错误处理和日志记录

### 数据库操作

- 使用连接池管理数据库连接
- 使用事务保证数据一致性
- 使用唯一索引防止重复数据

## 常见问题

### 1. 数据库连接失败

- 检查数据库服务是否启动
- 检查 `.env` 中的数据库配置是否正确
- 确认数据库已创建并执行了初始化脚本

### 2. 邮件发送失败

- 确认使用的是授权码而不是邮箱密码
- 检查SMTP服务是否已开启
- 确认 `EMAIL_SECURE` 配置正确（587端口通常为false，465端口通常为true）

### 3. 定时任务不执行

- 检查 `CRON_SCHEDULE` 配置是否正确
- 确认服务器时区设置正确
- 查看应用日志确认任务是否已启动

更多问题请参考：[配置说明.md](./配置说明.md)

## 部署建议

### 使用 PM2 管理进程

```bash
npm install -g pm2
pm2 start src/app.js --name jun-an-fou
pm2 save
pm2 startup
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 版本信息

- 版本：v1.0
- 创建日期：2026-02-03

## 许可证

ISC

## 联系方式

如有问题，请查看项目文档或提交Issue。
