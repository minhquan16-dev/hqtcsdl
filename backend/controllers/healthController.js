function getHealth(req, res) {
  return res.json({
    success: true,
    message: 'Backend đang hoạt động',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = {
  getHealth,
};
