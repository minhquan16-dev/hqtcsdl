const express = require('express');
const chatService = require('../services/chatService');

const router = express.Router();

router.post('/chat', async (req, res, next) => {
  try {
    const result = await chatService.handleChat(req.body?.message, {
      history: req.body?.history,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
