function createSuccessResponse(message, data = []) {
  return {
    success: true,
    message,
    data,
  };
}

function createErrorResponse(message, error) {
  const payload = {
    success: false,
    message,
  };

  if (error !== undefined) {
    payload.error = error;
  }

  return payload;
}

function sendSuccess(res, message, data = []) {
  return res.json(createSuccessResponse(message, data));
}

function sendEmpty(res, data = []) {
  return res.json(createSuccessResponse('Không có dữ liệu phù hợp', data));
}

function sendValidationError(res, error) {
  return res.status(400).json(createErrorResponse('Tham số không hợp lệ', error));
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  sendSuccess,
  sendEmpty,
  sendValidationError,
};
