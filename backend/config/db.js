const sql = require('mssql');

const requiredEnvKeys = [
  'DB_SERVER',
  'DB_PORT',
  'DB_DATABASE',
  'DB_USER',
  'DB_PASSWORD',
  'DB_ENCRYPT',
  'DB_TRUST_SERVER_CERTIFICATE',
];

for (const key of requiredEnvKeys) {
  if (!process.env[key]) {
    console.error(`Thiếu biến môi trường ${key}`);
    process.exit(1);
  }
}

const dbConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log('Kết nối SQL Server thành công');
    return pool;
  })
  .catch((error) => {
    console.error('Kết nối SQL Server thất bại:', error.message);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
