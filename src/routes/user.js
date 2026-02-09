const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 获取用户信息
router.get('/info', userController.getUserInfo);

module.exports = router;
