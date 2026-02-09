const express = require('express');
const router = express.Router();
const signController = require('../controllers/signController');

// 用户签到
router.post('/', signController.sign);

// 获取签到记录
router.get('/records', signController.getSignRecords);

module.exports = router;
