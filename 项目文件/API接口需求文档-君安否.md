# 君安否微信小程序 - API 接口需求文档

## 一、文档说明

**项目名称**：君安否  
**文档版本**：v1.0  
**创建日期**：2026-02-03  
**文档用途**：指导后端开发人员实现 API 接口

## 二、接口规范

### 2.1 基础信息

- **API 基础地址**：`https://your-api-domain.com/api`
- **请求格式**：JSON
- **响应格式**：JSON
- **字符编码**：UTF-8
- **请求方式**：支持 GET、POST

### 2.2 统一响应格式

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

### 2.3 错误码定义

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

### 2.4 请求头说明

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

**业务逻辑**：

1. **参数验证**：
   - 验证 `name` 参数：不能为空，长度2-20个字符，支持中文、英文、数字
   - 验证 `email` 参数：不能为空，符合邮箱格式规范
   - 验证 `openid` 参数：如果提供，长度不超过64个字符

2. **用户识别**：
   - 如果提供了 `openid`，优先通过 `openid` 查询用户（`T_USER.OPENID`）
   - 如果未提供 `openid` 或查询不到用户，则通过 `email` 查询用户（`T_USER.EMAIL`）
   - 如果都查询不到，则创建新用户

3. **创建/更新用户**：
   - 如果是新用户，创建用户记录：
     - `OPENID`：如果提供了openid则使用，否则为空字符串或NULL
     - `NICKNAME`：使用 `name` 参数
     - `EMAIL`：使用 `email` 参数
     - `EMAIL_VERIFIED`：默认为 0（未验证）
     - `STATUS`：默认为 1（正常）
     - `DELETE_FLAG`：默认为 0（未删除）
   - 如果是现有用户，更新用户信息：
     - 如果提供了 `name`，更新 `NICKNAME`
     - 如果提供了 `email`，更新 `EMAIL`
     - 如果提供了 `openid` 且用户没有openid，更新 `OPENID`

4. **签到处理**：
   - 检查今日是否已签到：
     - 查询 `T_SIGN_RECORD` 表，条件：`USER_ID = ? AND SIGN_DATE = CURDATE()`
     - 如果已签到，返回错误码 `3001`（今日已签到）
   - 插入签到记录：
     - `USER_ID`：用户ID
     - `SIGN_DATE`：当前日期（`CURDATE()`）
     - `SIGN_TIME`：当前时间（`NOW()`）
   - 计算连续签到天数：
     - 查询用户最近一次签到日期（`T_USER.LAST_SIGN_TIME`）
     - 如果 `LAST_SIGN_TIME` 为 NULL 或日期不是昨天，则 `CONTINUOUS_DAYS = 1`
     - 如果 `LAST_SIGN_TIME` 是昨天，则 `CONTINUOUS_DAYS = CONTINUOUS_DAYS + 1`
   - 更新用户签到统计：
     - `LAST_SIGN_TIME`：当前时间（`NOW()`）
     - `CONTINUOUS_DAYS`：计算后的连续签到天数
     - `TOTAL_SIGN_DAYS`：`TOTAL_SIGN_DAYS + 1`

5. **返回结果**：
   - 返回签到成功信息，包括签到日期、时间、连续签到天数、累计签到天数

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

**注意事项**：

- 使用数据库事务确保用户信息和签到记录的原子性操作
- 使用唯一索引 `uni_inx_user_date` 防止并发签到导致重复记录
- 建议使用分布式锁或数据库行锁防止并发问题
- 时区使用服务器时区，签到日期使用 `CURDATE()` 获取

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

**业务逻辑**：

1. **参数验证**：
   - `openid` 和 `email` 至少提供一个
   - 如果提供了 `openid`，优先通过 `openid` 查询
   - 如果只提供了 `email`，通过 `email` 查询

2. **查询用户**：
   - 查询 `T_USER` 表
   - 条件：`STATUS = 1 AND DELETE_FLAG = 0`
   - 如果查询不到，返回错误码 `2001`（用户不存在）
   - 如果用户状态为禁用，返回错误码 `2002`（用户已被禁用）

3. **返回结果**：
   - 返回用户完整信息

**错误响应示例**：

```json
{
  "code": 2001,
  "message": "用户不存在",
  "data": null
}
```

```json
{
  "code": 1002,
  "message": "参数缺失：openid和email至少提供一个",
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

**业务逻辑**：

1. **参数验证**：
   - `openid` 和 `email` 至少提供一个
   - `startDate` 和 `endDate` 如果提供，需要验证日期格式
   - `page` 和 `pageSize` 需要验证范围

2. **查询用户**：
   - 根据 `openid` 或 `email` 查询用户ID
   - 如果用户不存在，返回错误码 `2001`

3. **查询签到记录**：
   - 查询 `T_SIGN_RECORD` 表
   - 条件：
     - `USER_ID = ?`
     - 如果提供了 `startDate`，`SIGN_DATE >= startDate`
     - 如果提供了 `endDate`，`SIGN_DATE <= endDate`
     - 如果都未提供，默认查询最近30天：`SIGN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
   - 排序：`ORDER BY SIGN_DATE DESC`
   - 分页：`LIMIT (page - 1) * pageSize, pageSize`

4. **返回结果**：
   - 返回签到记录列表和分页信息

**错误响应示例**：

```json
{
  "code": 2001,
  "message": "用户不存在",
  "data": null
}
```

```json
{
  "code": 1003,
  "message": "日期格式错误：startDate",
  "data": null
}
```

---

## 四、数据库操作说明

### 4.1 签到接口数据库操作

**步骤1：查询或创建用户**

```sql
-- 如果提供了openid，优先通过openid查询
SELECT ID, OPENID, NICKNAME, EMAIL, STATUS, DELETE_FLAG, LAST_SIGN_TIME, CONTINUOUS_DAYS, TOTAL_SIGN_DAYS
FROM T_USER
WHERE OPENID = ? AND DELETE_FLAG = 0
LIMIT 1;

-- 如果未查询到，通过email查询
SELECT ID, OPENID, NICKNAME, EMAIL, STATUS, DELETE_FLAG, LAST_SIGN_TIME, CONTINUOUS_DAYS, TOTAL_SIGN_DAYS
FROM T_USER
WHERE EMAIL = ? AND DELETE_FLAG = 0
LIMIT 1;

-- 如果都未查询到，创建新用户
INSERT INTO T_USER (OPENID, NICKNAME, EMAIL, EMAIL_VERIFIED, STATUS, DELETE_FLAG, CREATE_TIME, UPDATE_TIME)
VALUES (?, ?, ?, 0, 1, 0, NOW(), NOW());
```

**步骤2：检查今日是否已签到**

```sql
SELECT ID FROM T_SIGN_RECORD
WHERE USER_ID = ? AND SIGN_DATE = CURDATE()
LIMIT 1;
```

**步骤3：插入签到记录**

```sql
INSERT INTO T_SIGN_RECORD (USER_ID, SIGN_DATE, SIGN_TIME, CREATE_TIME)
VALUES (?, CURDATE(), NOW(), NOW());
```

**步骤4：更新用户签到统计**

```sql
UPDATE T_USER 
SET LAST_SIGN_TIME = NOW(),
    CONTINUOUS_DAYS = CASE 
        WHEN LAST_SIGN_TIME IS NULL THEN 1
        WHEN DATE(LAST_SIGN_TIME) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
        THEN CONTINUOUS_DAYS + 1 
        ELSE 1 
    END,
    TOTAL_SIGN_DAYS = TOTAL_SIGN_DAYS + 1,
    UPDATE_TIME = NOW()
WHERE ID = ?;
```

**步骤5：更新用户信息（如果提供了name或email）**

```sql
UPDATE T_USER
SET NICKNAME = ?,
    EMAIL = ?,
    UPDATE_TIME = NOW()
WHERE ID = ?;
```

### 4.2 获取用户信息接口数据库操作

```sql
-- 通过openid查询
SELECT ID, OPENID, NICKNAME, AVATAR_URL, EMAIL, EMAIL_VERIFIED, 
       LAST_SIGN_TIME, CONTINUOUS_DAYS, TOTAL_SIGN_DAYS, STATUS
FROM T_USER
WHERE OPENID = ? AND STATUS = 1 AND DELETE_FLAG = 0
LIMIT 1;

-- 或通过email查询
SELECT ID, OPENID, NICKNAME, AVATAR_URL, EMAIL, EMAIL_VERIFIED, 
       LAST_SIGN_TIME, CONTINUOUS_DAYS, TOTAL_SIGN_DAYS, STATUS
FROM T_USER
WHERE EMAIL = ? AND STATUS = 1 AND DELETE_FLAG = 0
LIMIT 1;
```

### 4.3 获取签到记录接口数据库操作

```sql
-- 先查询用户ID
SELECT ID FROM T_USER
WHERE (OPENID = ? OR EMAIL = ?) AND STATUS = 1 AND DELETE_FLAG = 0
LIMIT 1;

-- 查询签到记录（带分页）
SELECT SIGN_DATE, SIGN_TIME
FROM T_SIGN_RECORD
WHERE USER_ID = ?
  AND SIGN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY SIGN_DATE DESC
LIMIT ?, ?;

-- 查询总记录数
SELECT COUNT(*) as total
FROM T_SIGN_RECORD
WHERE USER_ID = ?
  AND SIGN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

## 五、业务规则说明

### 5.1 用户识别规则

1. **优先级**：openid > email
2. **如果提供了 openid**：
   - 优先通过 openid 查询用户
   - 如果查询不到，再通过 email 查询
   - 如果都查询不到，创建新用户（使用提供的 openid）
3. **如果只提供了 email**：
   - 通过 email 查询用户
   - 如果查询不到，创建新用户（openid 为空）

### 5.2 签到规则

1. **每日限制**：每个用户每天只能签到一次
2. **连续签到计算**：
   - 如果用户从未签到过，连续签到天数为 1
   - 如果用户上次签到是昨天，连续签到天数 +1
   - 如果用户上次签到不是昨天（包括今天已签到），连续签到天数重置为 1
3. **累计签到**：每次签到，累计签到天数 +1

### 5.3 并发控制

1. **数据库层面**：
   - 使用唯一索引 `uni_inx_user_date` 防止重复签到
   - 使用数据库事务保证数据一致性
2. **应用层面**：
   - 建议使用分布式锁（如 Redis）或数据库行锁
   - 锁的 key 可以是：`sign_lock_{userId}_{signDate}`

## 六、性能优化建议

1. **索引优化**：
   - 确保 `T_USER` 表的 `OPENID`、`EMAIL` 字段有索引
   - 确保 `T_SIGN_RECORD` 表的 `USER_ID`、`SIGN_DATE` 字段有索引
2. **查询优化**：
   - 签到记录查询使用日期范围限制，避免全表扫描
   - 分页查询使用 `LIMIT` 限制返回数量
3. **缓存策略**：
   - 可以考虑缓存用户信息（Redis），减少数据库查询
   - 缓存时间建议 5-10 分钟

## 七、测试用例

### 7.1 签到接口测试用例

| 测试场景 | 请求参数 | 预期结果 |
|---------|---------|---------|
| 正常签到（新用户） | name="张三", email="test@example.com" | 创建用户，签到成功，返回连续天数1 |
| 正常签到（老用户） | name="张三", email="test@example.com" | 签到成功，连续天数+1 |
| 重复签到 | 同一天再次签到 | 返回错误码3001 |
| 参数缺失 | 缺少name | 返回错误码1002 |
| 邮箱格式错误 | email="invalid" | 返回错误码4001 |
| 姓名格式错误 | name="a"（长度不足） | 返回错误码1003 |

### 7.2 获取用户信息接口测试用例

| 测试场景 | 请求参数 | 预期结果 |
|---------|---------|---------|
| 通过openid查询 | openid="xxx" | 返回用户信息 |
| 通过email查询 | email="test@example.com" | 返回用户信息 |
| 用户不存在 | openid="notexist" | 返回错误码2001 |
| 参数缺失 | 无参数 | 返回错误码1002 |

### 7.3 获取签到记录接口测试用例

| 测试场景 | 请求参数 | 预期结果 |
|---------|---------|---------|
| 正常查询 | openid="xxx", page=1, pageSize=30 | 返回签到记录列表 |
| 分页查询 | page=2, pageSize=10 | 返回第2页数据 |
| 日期范围查询 | startDate="2026-01-01", endDate="2026-02-03" | 返回指定日期范围的记录 |
| 用户不存在 | openid="notexist" | 返回错误码2001 |

## 八、接口调用示例

### 8.1 签到接口调用示例（JavaScript）

```javascript
// 使用 uni.request
uni.request({
  url: 'https://your-api-domain.com/api/sign',
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

### 8.2 获取用户信息接口调用示例

```javascript
uni.request({
  url: 'https://your-api-domain.com/api/user/info',
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

### 8.3 获取签到记录接口调用示例

```javascript
uni.request({
  url: 'https://your-api-domain.com/api/sign/records',
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

## 九、注意事项

1. **时区处理**：所有日期时间使用服务器时区，签到日期使用 `CURDATE()` 获取
2. **并发控制**：签到接口需要考虑并发问题，建议使用分布式锁或数据库行锁
3. **事务处理**：签到接口涉及多表操作，必须使用数据库事务保证数据一致性
4. **错误处理**：所有接口都需要完善的错误处理和错误码返回
5. **日志记录**：建议记录关键操作日志，便于问题排查
6. **参数验证**：所有接口都需要进行参数验证，防止非法输入
7. **SQL注入防护**：使用参数化查询，防止SQL注入攻击

## 十、版本记录

| 版本 | 日期 | 说明 | 作者 |
|------|------|------|------|
| v1.0 | 2026-02-03 | 初始版本，完成基础接口设计 | - |

---

**文档结束**
