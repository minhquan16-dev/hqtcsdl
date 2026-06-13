const express = require('express');
const systemTaskService = require('../services/systemTaskService');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

function createTaskHandler(taskName, message) {
  return async (req, res, next) => {
    try {
      const result = await systemTaskService.runSystemTask(taskName);
      return sendSuccess(res, message, result);
    } catch (error) {
      return next(error);
    }
  };
}

router.post('/system/crawl', createTaskHandler(
  'crawl',
  'Cào dữ liệu tuyển dụng thành công',
));
router.post('/system/etl', createTaskHandler(
  'etl',
  'Chạy ETL kho dữ liệu thành công',
));

module.exports = router;
