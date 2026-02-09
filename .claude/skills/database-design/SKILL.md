---
name: database-design
description: BK-CI 数据库设计规范与表结构指南，涵盖命名规范、字段类型选择、索引设计、分表策略、数据归档。当用户设计数据库表、优化索引、规划分表策略或进行数据库架构设计时使用。
---

# BK-CI 数据库设计规范与表结构指南

## 一、数据库架构概述

### 1.1 数据库分布

BK-CI 采用微服务架构，每个服务拥有独立的数据库：

| 数据库名 | 所属服务 | 说明 |
|----------|----------|------|
| `devops_ci_process` | Process | 流水线核心数据 |
| `devops_ci_store` | Store | 研发商店数据 |
| `devops_ci_auth` | Auth | 权限认证数据 |
| `devops_ci_project` | Project | 项目管理数据 |
| `devops_ci_quality` | Quality | 质量红线数据 |
| `devops_ci_dispatch` | Dispatch | 构建调度数据 |
| `devops_ci_repository` | Repository | 代码库数据 |
| `devops_ci_metrics` | Metrics | 度量数据 |
| `devops_ci_environment` | Environment | 构建机环境数据 |
| `devops_ci_notify` | Notify | 通知服务数据 |
| `devops_ci_ticket` | Ticket | 凭证管理数据 |
| `devops_ci_artifactory` | Artifactory | 制品库数据 |
| `devops_ci_openapi` | OpenAPI | 开放接口数据 |
| `devops_ci_log` | Log | 日志服务数据 |

### 1.2 SQL 脚本组织规范

```
support-files/sql/
├── 0001_ci_create-database_mysql.sql   # 创建所有数据库
├── 1001_ci_*_ddl_mysql.sql            # 各模块完整 DDL
├── 2001_v0.x/ ~ 2025_v4.x/            # 各版本增量更新
└── 5001_init_dml/                     # 初始化数据
```

**命名规范**：
- 创建数据库：`0001_{系统}_create-database_{db类型}.sql`
- 完整 DDL：`1xxx_{系统}_{模块}_ddl_{db类型}.sql`
- 增量更新：`2xxx_{系统}_{模块}_update_{版本号}_{db类型}.sql`
- 初始化数据：`5001_{系统}_{模块}_dml_{db类型}.sql`

**核心表结构**：Process（流水线/构建）、Project、Auth、Store、Repository、Dispatch、Environment 等模块的完整 DDL 见 [reference/tables.md](reference/tables.md)。

## 二、表设计规范

### 2.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | `T_` 前缀 + 大写下划线 | `T_PIPELINE_BUILD_HISTORY` |
| 主键 | `ID` 或 `{表名}_ID` | `PIPELINE_ID`, `BUILD_ID` |
| 外键 | `{关联表}_ID` | `PROJECT_ID`, `NODE_ID` |
| 索引 | `idx_` 或 `inx_` 前缀 | `idx_project_id`, `inx_status` |
| 唯一索引 | `uni_inx_` 或 `UNI_` 前缀 | `uni_inx_code_version` |
| 时间字段 | `*_TIME` 后缀 | `CREATE_TIME`, `UPDATE_TIME` |
| 标记字段 | `*_FLAG` 后缀 | `LATEST_FLAG`, `DELETE_FLAG` |

### 2.2 ID 设计规范

```
项目ID：  英文名称（如 demo_project）
流水线ID： p-{32位UUID} = 34位
构建ID：  b-{32位UUID} = 34位
任务ID：  t-{32位UUID} = 34位
阶段ID：  s-{32位UUID} = 34位
容器ID：  c-{32位UUID} = 34位
插件ID：  32位UUID
```

### 2.3 状态字段设计

- **构建状态**（int）：0 排队、1 运行中、2 成功、3 失败、4 取消、5 终止等。
- **插件状态**（tinyint）：0 初始化、1 提交中、…、7 已发布、10 已下架等。

### 2.4 字段类型规范

| 场景 | 类型 | 说明 |
|------|------|------|
| 主键ID | `varchar(32)` 或 `bigint(20)` | UUID 用 varchar，自增用 bigint |
| 项目/流水线ID | `varchar(64)` | 预留足够长度 |
| 名称 | `varchar(64)` ~ `varchar(255)` | 根据业务需求 |
| 描述 | `varchar(1024)` 或 `text` | 短描述用 varchar |
| JSON 数据 | `mediumtext` 或 `json` | 大 JSON 用 mediumtext |
| 时间 | `datetime` 或 `timestamp` | 需要自动更新用 timestamp |
| 布尔 | `bit(1)` | 默认 `b'0'` |
| 状态 | `int(11)` 或 `tinyint(4)` | 枚举值用 tinyint |

### 2.5 索引设计规范

```sql
-- 主键
PRIMARY KEY (`ID`)

-- 唯一索引（业务唯一约束）
UNIQUE KEY `uni_inx_code_version` (`ATOM_CODE`, `VERSION`)

-- 普通索引（查询优化）
KEY `idx_project_pipeline` (`PROJECT_ID`, `PIPELINE_ID`)

-- 复合索引（遵循最左前缀原则）
KEY `STATUS_KEY` (`PROJECT_ID`, `PIPELINE_ID`, `STATUS`)

-- 时间索引（范围查询）
KEY `inx_start_time` (`START_TIME`)
```

**BUILD vs RECORD 表**：BUILD 系列用于引擎调度与 Worker 拉取任务；RECORD 系列用于前端构建详情与历史记录，且通过 `EXECUTE_COUNT` 支持同一构建的多次重试记录。

## 三、SQL 脚本编写规范

### 3.1 幂等性要求

```sql
-- 建表必须使用 IF NOT EXISTS
CREATE TABLE IF NOT EXISTS `T_EXAMPLE` (...);

-- 插入数据使用 INSERT IGNORE 防止覆盖
INSERT IGNORE INTO T_EXAMPLE (ID, NAME) VALUES (1, 'test');

-- 需要强制刷新的系统数据使用 ON DUPLICATE KEY UPDATE
INSERT INTO T_EXAMPLE (ID, NAME) VALUES (1, 'test')
ON DUPLICATE KEY UPDATE NAME = 'test';

-- 禁止直接删除表后重建
```

### 3.2 字段变更规范

```sql
-- 新增字段必须有默认值或允许 NULL
ALTER TABLE T_EXAMPLE ADD COLUMN NEW_FIELD varchar(64) DEFAULT '';

-- 禁止改名字段（会导致数据丢失）
-- 使用存储过程判断字段是否存在后再 ADD COLUMN
```

### 3.3 索引变更规范

使用存储过程判断索引是否存在后再 `ADD INDEX`，避免重复添加报错。

**详细脚本管理**（双轨更新、命名、回滚）：见 [reference/1-script-management.md](reference/1-script-management.md)。

## 四、分库分表设计

- 通过 `T_SHARDING_ROUTING_RULE` 配置路由规则；`T_DATA_SOURCE` 配置数据源。
- 分片键常用 `PROJECT_ID`；绑定表使用相同分片键以支持关联查询。

**分片策略、跨分片查询、数据迁移**：见 [reference/2-sharding.md](reference/2-sharding.md)。

## 五、常用查询模式

### 流水线查询

```sql
-- 项目下流水线列表
SELECT * FROM T_PIPELINE_INFO WHERE PROJECT_ID = ? AND `DELETE` = 0 ORDER BY CREATE_TIME DESC;

-- 流水线最新版本编排
SELECT * FROM T_PIPELINE_RESOURCE WHERE PIPELINE_ID = ? ORDER BY VERSION DESC LIMIT 1;

-- 构建历史
SELECT * FROM T_PIPELINE_BUILD_HISTORY WHERE PROJECT_ID = ? AND PIPELINE_ID = ? ORDER BY BUILD_NUM DESC LIMIT ?, ?;
```

### 构建查询

```sql
-- 构建任务列表
SELECT * FROM T_PIPELINE_BUILD_TASK WHERE BUILD_ID = ? ORDER BY STAGE_ID, CONTAINER_ID, TASK_SEQ;

-- 构建变量
SELECT * FROM T_PIPELINE_BUILD_VAR WHERE BUILD_ID = ?;
```

### 统计查询

```sql
SELECT PROJECT_ID, COUNT(*) FROM T_PIPELINE_INFO WHERE `DELETE` = 0 GROUP BY PROJECT_ID;
SELECT STATUS, COUNT(*) FROM T_PIPELINE_BUILD_HISTORY WHERE PROJECT_ID = ? AND PIPELINE_ID = ? GROUP BY STATUS;
```

## 六、性能优化建议

1. **索引**：复合索引遵循最左前缀；高频查询字段建索引；避免在索引列上使用函数。
2. **查询**：使用 LIMIT；避免 SELECT *；大表分页优先游标分页。
3. **表设计**：大字段（TEXT/BLOB）拆分到独立表；历史数据定期归档；热点数据使用缓存；考虑读写分离。

---

## 扩展资源

- **核心表结构 DDL**（Process/Project/Auth/Store/Repository/Dispatch/Environment）：[reference/tables.md](reference/tables.md)
- **数据库脚本管理**（双轨更新、幂等、命名）：[reference/1-script-management.md](reference/1-script-management.md)
- **数据库分片**（分片键、绑定表、跨分片）：[reference/2-sharding.md](reference/2-sharding.md)
