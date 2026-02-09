-- ============================================
-- 君安否微信小程序 - 数据库初始化脚本
-- 数据库名：jun_an_fou
-- 版本：v1.0
-- 日期：2026-02-03
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `jun_an_fou` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jun_an_fou`;

-- ============================================
-- 1. 用户表（T_USER）
-- ============================================
CREATE TABLE IF NOT EXISTS `T_USER` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `OPENID` varchar(64) DEFAULT NULL COMMENT '微信用户openid（允许为空，用于非微信小程序用户）',
  `NICKNAME` varchar(64) DEFAULT NULL COMMENT '微信昵称',
  `AVATAR_URL` varchar(512) DEFAULT NULL COMMENT '微信头像URL',
  `EMAIL` varchar(128) NOT NULL COMMENT '用户邮箱',
  `EMAIL_VERIFIED` bit(1) NOT NULL DEFAULT b'0' COMMENT '邮箱是否已验证',
  `LAST_SIGN_TIME` datetime DEFAULT NULL COMMENT '最后一次签到时间',
  `CONTINUOUS_DAYS` int(11) NOT NULL DEFAULT 0 COMMENT '连续签到天数',
  `TOTAL_SIGN_DAYS` int(11) NOT NULL DEFAULT 0 COMMENT '累计签到天数',
  `STATUS` tinyint(4) NOT NULL DEFAULT 1 COMMENT '用户状态：1-正常，0-禁用',
  `DELETE_FLAG` bit(1) NOT NULL DEFAULT b'0' COMMENT '删除标记：0-未删除，1-已删除',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uni_inx_openid` (`OPENID`),
  KEY `idx_email` (`EMAIL`),
  KEY `idx_status` (`STATUS`, `DELETE_FLAG`),
  KEY `idx_last_sign_time` (`LAST_SIGN_TIME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 2. 签到记录表（T_SIGN_RECORD）
-- ============================================
CREATE TABLE IF NOT EXISTS `T_SIGN_RECORD` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `USER_ID` bigint(20) NOT NULL COMMENT '用户ID',
  `SIGN_DATE` date NOT NULL COMMENT '签到日期',
  `SIGN_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '签到时间',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uni_inx_user_date` (`USER_ID`, `SIGN_DATE`),
  KEY `idx_user_id` (`USER_ID`),
  KEY `idx_sign_date` (`SIGN_DATE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到记录表';

-- ============================================
-- 3. 邮件通知记录表（T_EMAIL_NOTIFY）
-- ============================================
CREATE TABLE IF NOT EXISTS `T_EMAIL_NOTIFY` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `USER_ID` bigint(20) NOT NULL COMMENT '用户ID',
  `EMAIL` varchar(128) NOT NULL COMMENT '接收邮箱',
  `NOTIFY_TYPE` tinyint(4) NOT NULL DEFAULT 1 COMMENT '通知类型：1-连续两天未签到提醒',
  `NOTIFY_DATE` date NOT NULL COMMENT '通知日期',
  `NOTIFY_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知发送时间',
  `SEND_STATUS` tinyint(4) NOT NULL DEFAULT 0 COMMENT '发送状态：0-待发送，1-发送成功，2-发送失败',
  `ERROR_MSG` varchar(512) DEFAULT NULL COMMENT '发送失败时的错误信息',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`ID`),
  KEY `idx_user_id` (`USER_ID`),
  KEY `idx_notify_date` (`NOTIFY_DATE`),
  KEY `idx_send_status` (`SEND_STATUS`),
  KEY `idx_user_notify_date` (`USER_ID`, `NOTIFY_DATE`, `NOTIFY_TYPE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮件通知记录表';

-- ============================================
-- 初始化完成
-- ============================================
