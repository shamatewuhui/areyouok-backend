const User = require('../models/user');

/**
 * 获取用户信息
 */
async function getUserInfo(req, res) {
  try {
    const { openid, email } = req.query;

    // 参数验证
    if (!openid && !email) {
      return res.json({ code: 1002, message: '参数缺失：openid和email至少提供一个', data: null });
    }

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

    // 格式化返回数据
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        userId: user.ID,
        openid: user.OPENID || '',
        nickname: user.NICKNAME || '',
        avatarUrl: user.AVATAR_URL || '',
        email: user.EMAIL,
        emailVerified: user.EMAIL_VERIFIED ? true : false,
        lastSignTime: user.LAST_SIGN_TIME
          ? user.LAST_SIGN_TIME.toISOString().replace('T', ' ').substring(0, 19)
          : null,
        continuousDays: user.CONTINUOUS_DAYS || 0,
        totalSignDays: user.TOTAL_SIGN_DAYS || 0,
        status: user.STATUS
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.json({ code: 5001, message: '服务器内部错误', data: null });
  }
}

module.exports = {
  getUserInfo
};
