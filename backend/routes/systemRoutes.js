const express = require('express');
const systemScheduleService = require('../services/systemScheduleService');
const { sendSuccess } = require('../utils/apiResponse');

const router = express.Router();

function createTaskHandler(taskName, message) {
  return async (req, res, next) => {
    try {
      const result = systemScheduleService.startSystemJob(taskName, 'manual');
      return sendSuccess(res, message, result);
    } catch (error) {
      return next(error);
    }
  };
}

router.post('/system/crawl', createTaskHandler(
  'crawl',
  'Đã bắt đầu cào dữ liệu tuyển dụng',
));
router.post('/system/etl', createTaskHandler(
  'etl',
  'Đã bắt đầu chạy ETL kho dữ liệu',
));
router.post('/system/crawl-then-etl', createTaskHandler(
  'crawl_then_etl',
  'Đã bắt đầu cào dữ liệu rồi chạy ETL',
));

router.get('/system/schedule', (req, res, next) => {
  try {
    return sendSuccess(res, 'Lấy lịch chạy hệ thống thành công', systemScheduleService.getSchedule());
  } catch (error) {
    return next(error);
  }
});

router.put('/system/schedule', (req, res, next) => {
  try {
    const schedule = systemScheduleService.saveSchedule(req.body);
    return sendSuccess(res, 'Lưu lịch chạy hệ thống thành công', schedule);
  } catch (error) {
    return next(error);
  }
});

router.delete('/system/schedule', (req, res, next) => {
  try {
    const schedule = systemScheduleService.clearSchedule();
    return sendSuccess(res, 'Đã tắt lịch chạy hệ thống', schedule);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
