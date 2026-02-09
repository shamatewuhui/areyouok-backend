# 君安否小程序 - API 接口文档

## 一、文档说明

**项目名称**：君安否  
**文档版本**：v1.0  
**创建日期**：2026-02-03  
**API 基础地址**：`http://your-domain.com/api`

## 二、接口规范

### 2.1 统一响应格式

所有接口响应遵循以下格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    // 具体数据内容
  }
}
```

**响应字段说明**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | int | 是 | 状态码，0表示成功，非0表示失败 |
| message | string | 是 | 响应消息，成功时可为空，失败时必填 |
| data | object | 否 | 响应数据，根据接口不同而变化 |

### 2.2 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 参数缺失 |
| 1003 | 参数格式错误 |
| 2001 | 用户不存在 |
| 2002 | 用户已被禁用 |
| 3001 | 今日已签到 |
| 3002 | 签到失败 |
| 4001 | 邮箱格式错误 |
| 4002 | 邮箱未验证 |
| 5001 | 服务器内部错误 |
| 5002 | 数据库操作失败 |

### 2.3 请求头说明

| 请求头 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Content-Type | string | 是 | application/json |

## 三、接口列表

### 3.1 用户签到接口

**接口描述**：用户每日签到接口，支持创建新用户或更新现有用户签到记录。

**接口地址**：`POST /api/sign`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 用户姓名，2-20个字符，支持中文、英文、数字 |
| email | string | 是 | 联系人邮箱，用于接收提醒邮件 |
| openid | string | 否 | 微信用户openid，如果提供则用于识别用户身份 |

**请求示例**：

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"
}
```

**响应参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| signDate | string | 签到日期，格式：YYYY-MM-DD |
| signTime | string | 签到时间，格式：YYYY-MM-DD HH:mm:ss |
| continuousDays | int | 连续签到天数 |
| totalSignDays | int | 累计签到天数 |
| userId | long | 用户ID |

**响应示例**：

```json
{
  "code": 0,
  "message": "签到成功",
  "data": {
    "signDate": "2026-02-03",
    "signTime": "2026-02-03 14:30:00",
    "continuousDays": 5,
    "totalSignDays": 30,
    "userId": 12345
  }
}
```

**错误响应示例**：

```json
{
  "code": 3001,
  "message": "今日已签到，请勿重复签到",
  "data": null
}
```

```json
{
  "code": 1002,
  "message": "参数缺失：name",
  "data": null
}
```

```json
{
  "code": 4001,
  "message": "邮箱格式错误",
  "data": null
}
```

---

### 3.2 获取用户信息接口

**接口描述**：根据 openid 或 email 获取用户信息。

**接口地址**：`GET /api/user/info`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | string | 否 | 微信用户openid（openid和email至少提供一个） |
| email | string | 否 | 用户邮箱（openid和email至少提供一个） |

**请求示例**：

```
GET /api/user/info?openid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o
```

或

```
GET /api/user/info?email=zhangsan@example.com
```

**响应参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | long | 用户ID |
| openid | string | 微信openid |
| nickname | string | 用户昵称 |
| avatarUrl | string | 微信头像URL |
| email | string | 用户邮箱 |
| emailVerified | boolean | 邮箱是否已验证 |
| lastSignTime | string | 最后一次签到时间，格式：YYYY-MM-DD HH:mm:ss |
| continuousDays | int | 连续签到天数 |
| totalSignDays | int | 累计签到天数 |
| status | int | 用户状态：1-正常，0-禁用 |

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "userId": 12345,
    "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
    "nickname": "张三",
    "avatarUrl": "https://thirdwx.qlogo.cn/...",
    "email": "zhangsan@example.com",
    "emailVerified": false,
    "lastSignTime": "2026-02-02 14:30:00",
    "continuousDays": 4,
    "totalSignDays": 29,
    "status": 1
  }
}
```

**错误响应示例**：

```json
{
  "code": 2001,
  "message": "用户不存在",
  "data": null
}
```

---

### 3.3 获取签到记录接口

**接口描述**：获取用户的签到记录列表。

**接口地址**：`GET /api/sign/records`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | string | 否 | 微信用户openid（openid和email至少提供一个） |
| email | string | 否 | 用户邮箱（openid和email至少提供一个） |
| startDate | string | 否 | 开始日期，格式：YYYY-MM-DD，默认查询最近30天 |
| endDate | string | 否 | 结束日期，格式：YYYY-MM-DD，默认当前日期 |
| page | int | 否 | 页码，从1开始，默认1 |
| pageSize | int | 否 | 每页数量，默认30，最大100 |

**请求示例**：

```
GET /api/sign/records?openid=oUpF8uMuAJO_M2pxb1Q9zNjWeS6o&page=1&pageSize=30
```

**响应参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| records | array | 签到记录列表 |
| records[].signDate | string | 签到日期，格式：YYYY-MM-DD |
| records[].signTime | string | 签到时间，格式：YYYY-MM-DD HH:mm:ss |
| total | int | 总记录数 |
| page | int | 当前页码 |
| pageSize | int | 每页数量 |

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "signDate": "2026-02-03",
        "signTime": "2026-02-03 14:30:00"
      },
      {
        "signDate": "2026-02-02",
        "signTime": "2026-02-02 15:20:10"
      },
      {
        "signDate": "2026-02-01",
        "signTime": "2026-02-01 16:10:30"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 30
  }
}
```

---

### 3.4 健康检查接口

**接口描述**：检查服务是否正常运行。

**接口地址**：`GET /health`

**响应示例**：

```json
{
  "status": "ok",
  "timestamp": "2026-02-03T14:30:00.000Z"
}
```

## 四、业务规则说明

### 4.1 用户识别规则

1. **优先级**：openid > email
2. **如果提供了 openid**：
   - 优先通过 openid 查询用户
   - 如果查询不到，再通过 email 查询
   - 如果都查询不到，创建新用户（使用提供的 openid）
3. **如果只提供了 email**：
   - 通过 email 查询用户
   - 如果查询不到，创建新用户（openid 为空）

### 4.2 签到规则

1. **每日限制**：每个用户每天只能签到一次
2. **连续签到计算**：
   - 如果用户从未签到过，连续签到天数为 1
   - 如果用户上次签到是昨天，连续签到天数 +1
   - 如果用户上次签到不是昨天（包括今天已签到），连续签到天数重置为 1
3. **累计签到**：每次签到，累计签到天数 +1

### 4.3 邮件提醒规则

1. **触发条件**：用户连续两天未签到
2. **发送时间**：每天凌晨1点（可通过环境变量配置）
3. **防重复发送**：同一未签到日期只发送一次提醒邮件
4. **邮件内容**：可通过环境变量配置邮件主题和内容

## 五、接口调用示例

### 5.1 签到接口调用示例（JavaScript）

```javascript
// 使用 uni.request
uni.request({
  url: 'http://your-domain.com/api/sign',
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  data: {
    name: '张三',
    email: 'zhangsan@example.com',
    openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o'
  },
  success: (res) => {
    if (res.statusCode === 200 && res.data.code === 0) {
      console.log('签到成功:', res.data.data)
    } else {
      console.error('签到失败:', res.data.message)
    }
  },
  fail: (err) => {
    console.error('请求失败:', err)
  }
})
```

### 5.2 获取用户信息接口调用示例

```javascript
uni.request({
  url: 'http://your-domain.com/api/user/info',
  method: 'GET',
  data: {
    openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o'
  },
  success: (res) => {
    if (res.statusCode === 200 && res.data.code === 0) {
      console.log('用户信息:', res.data.data)
    }
  }
})
```

### 5.3 获取签到记录接口调用示例

```javascript
uni.request({
  url: 'http://your-domain.com/api/sign/records',
  method: 'GET',
  data: {
    openid: 'oUpF8uMuAJO_M2pxb1Q9zNjWeS6o',
    page: 1,
    pageSize: 30
  },
  success: (res) => {
    if (res.statusCode === 200 && res.data.code === 0) {
      console.log('签到记录:', res.data.data.records)
    }
  }
})
```

## 六、注意事项

1. **时区处理**：所有日期时间使用服务器时区，签到日期使用服务器当前日期
2. **并发控制**：签到接口使用数据库事务和唯一索引防止重复签到
3. **事务处理**：签到接口涉及多表操作，使用数据库事务保证数据一致性
4. **错误处理**：所有接口都有完善的错误处理和错误码返回
5. **日志记录**：关键操作都会记录日志，便于问题排查
6. **参数验证**：所有接口都进行参数验证，防止非法输入
7. **SQL注入防护**：使用参数化查询，防止SQL注入攻击

## 七、版本记录

| 版本 | 日期 | 说明 | 作者 |
|------|------|------|------|
| v1.0 | 2026-02-03 | 初始版本，完成基础接口实现 | - |

---

**文档结束**
