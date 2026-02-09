-- ============================================
-- 君安否微信小程序 - 数据库修复脚本
-- 修复 OPENID 字段的 NULL 问题
-- 版本：v1.1
-- 日期：2026-02-04
-- ============================================

USE `jun_an_fou`;

-- 修改 OPENID 字段，允许为 NULL
ALTER TABLE `T_USER` 
MODIFY COLUMN `OPENID` varchar(64) DEFAULT NULL COMMENT '微信用户openid（允许为空，用于非微信小程序用户）';

-- 注意：唯一索引 uni_inx_openid 会自动处理 NULL 值
-- MySQL 的唯一索引允许多个 NULL 值存在，只对非 NULL 值进行唯一性检查

-- 验证修改
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'jun_an_fou'
  AND TABLE_NAME = 'T_USER'
  AND COLUMN_NAME = 'OPENID';
