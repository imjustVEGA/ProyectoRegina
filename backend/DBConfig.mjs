const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE,
  dialect: "mssql",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    trustedConnection: true,
  },
};
export default dbConfig;

