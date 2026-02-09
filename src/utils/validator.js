const validator = require('validator');

/**
 * 验证邮箱格式
 */
function validateEmail(email) {
  return validator.isEmail(email);
}

/**
 * 验证用户名格式（2-20个字符，支持中文、英文、数字）
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9]{2,20}$/;
  return nameRegex.test(name);
}

/**
 * 验证日期格式（YYYY-MM-DD）
 */
function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * 验证分页参数
 */
function validatePagination(page, pageSize) {
  const p = parseInt(page) || 1;
  const ps = parseInt(pageSize) || 30;
  return {
    page: Math.max(1, p),
    pageSize: Math.min(100, Math.max(1, ps))
  };
}

module.exports = {
  validateEmail,
  validateName,
  validateDate,
  validatePagination
};
