const { createErrorResponse } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  return res.status(404).json(createErrorResponse('Không tìm thấy API yêu cầu'));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.statusCode === 400) {
    return res.status(400).json(createErrorResponse('Tham số không hợp lệ', error.message));
  }

  const detail = process.env.NODE_ENV === 'production' ? 'Không thể truy vấn dữ liệu' : error.message;
  return res.status(error.statusCode || 500).json(createErrorResponse('Đã xảy ra lỗi khi xử lý yêu cầu', detail));
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
