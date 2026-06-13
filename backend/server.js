const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../env/.env') });

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { poolPromise } = require('./config/db');

let server;
let keepAliveInterval;

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function startServer() {
  try {
    await poolPromise;

    const app = createApp();
    const port = Number(process.env.PORT) || 3001;

    server = app.listen(port, () => {
      console.log(`Máy chủ đang chạy tại cổng ${port}`);
    });

    // Node 24 trong môi trường chạy hiện tại có thể thoát nếu chỉ còn HTTP listener.
    keepAliveInterval = setInterval(() => {}, 1 << 30);

    return server;
  } catch (error) {
    console.error('Không thể khởi động máy chủ:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
};
