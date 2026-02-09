const User = require('../models/user');
const SignRecord = require('../models/signRecord');
const { validateEmail, validateName } = require('../utils/validator');
const pool = require('../config/database');

/**
 * 用户签到
 */
async function sign(req, res) {
  try {
    const { name, email, openid } = req.body;

    // 参数验证
    if (!name) {
      return res.json({ code: 1002, message: '参数缺失：name', data: null });
    }
    if (!email) {
      return res.json({ code: 1002, message: '参数缺失：email', data: null });
    }

    if (!validateName(name)) {
      return res.json({ code: 1003, message: '姓名格式错误：2-20个字符，支持中文、英文、数字', data: null });
    }

    if (!validateEmail(email)) {
      return res.json({ code: 4001, message: '邮箱格式错误', data: null });
    }

    if (openid && openid.length > 64) {
      return res.json({ code: 1003, message: 'openid长度不能超过64个字符', data: null });
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let user = null;

      // 用户识别：优先通过openid查询，再通过email查询
      if (openid) {
        user = await User.findByOpenid(openid);
      }
      if (!user) {
        user = await User.findByEmail(email);
      }

      // 创建或更新用户
      let userId;
      if (!user) {
        // 创建新用户
        userId = await User.create({ openid: openid || null, nickname: name, email });
        user = await User.findById(userId);
      } else {
        userId = user.ID;
        // 更新用户信息
        const updateData = {};
        if (name) updateData.nickname = name;
        if (email) updateData.email = email;
        if (openid && !user.OPENID) updateData.openid = openid;
        if (Object.keys(updateData).length > 0) {
          await User.update(userId, updateData);
        }
      }

      // 检查今日是否已签到
      const hasSigned = await SignRecord.hasSignedToday(userId);
      if (hasSigned) {
        await connection.rollback();
        connection.release();
        return res.json({ code: 3001, message: '今日已签到，请勿重复签到', data: null });
      }

      // 插入签到记录
      const now = new Date();
      const signDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      await SignRecord.create(userId, signDate, now);

      // 计算连续签到天数
      let continuousDays = 1;
      if (user.LAST_SIGN_TIME) {
        const lastSignDate = new Date(user.LAST_SIGN_TIME);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // 如果上次签到是昨天，连续天数+1
        if (lastSignDate.toDateString() === yesterday.toDateString()) {
          continuousDays = (user.CONTINUOUS_DAYS || 0) + 1;
        }
      }

      // 更新用户签到统计
      const totalSignDays = (user.TOTAL_SIGN_DAYS || 0) + 1;
      await User.updateSignStats(userId, now, continuousDays, totalSignDays);

      // 提交事务
      await connection.commit();
      connection.release();

      // 返回结果
      res.json({
        code: 0,
        message: '签到成功',
        data: {
          signDate: signDate,
          signTime: now.toISOString().replace('T', ' ').substring(0, 19),
          continuousDays: continuousDays,
          totalSignDays: totalSignDays,
          userId: userId
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('签到失败:', error);
    res.json({ code: 5001, message: '服务器内部错误', data: null });
  }
}

/**
 * 获取签到记录
 */
async function getSignRecords(req, res) {
  try {
    const { openid, email, startDate, endDate, page, pageSize } = req.query;

    // 参数验证
    if (!openid && !email) {
      return res.json({ code: 1002, message: '参数缺失：openid和email至少提供一个', data: null });
    }

    const { validateDate, validatePagination } = require('../utils/validator');
    if (startDate && !validateDate(startDate)) {
      return res.json({ code: 1003, message: '日期格式错误：startDate', data: null });
    }
    if (endDate && !validateDate(endDate)) {
      return res.json({ code: 1003, message: '日期格式错误：endDate', data: null });
    }

    const pagination = validatePagination(page, pageSize);

    // 查询用户
    let user = null;
    if (openid) {
      user = await User.findByOpenid(openid);
    }
    if (!user && email) {
      user = await User.findByEmail(email);
    }

    if (!user) {
      return res.json({ code: 2001, message: '用户不存在', data: null });
    }

    if (user.STATUS !== 1) {
      return res.json({ code: 2002, message: '用户已被禁用', data: null });
    }

    // 查询签到记录
    const records = await SignRecord.findByUserId(
      user.ID,
      startDate,
      endDate,
      pagination.page,
      pagination.pageSize
    );
    const total = await SignRecord.countByUserId(user.ID, startDate, endDate);

    // 格式化返回数据
    const formattedRecords = records.map(record => ({
      signDate: record.SIGN_DATE.toISOString().split('T')[0],
      signTime: record.SIGN_TIME.toISOString().replace('T', ' ').substring(0, 19)
    }));

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        records: formattedRecords,
        total: total,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
    });
  } catch (error) {
    console.error('获取签到记录失败:', error);
    res.json({ code: 5001, message: '服务器内部错误', data: null });
  }
}

module.exports = {
  sign,
  getSignRecords
};
