
const sql = require('mssql');

let pool = null;

const connectDB = async (config) => {
    try {
        if (pool) {
            await pool.close();
        }

        // Config object mapping
        const sqlConfig = {
            user: config.user,
            password: config.password,
            database: config.database,
            server: config.server,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: false, // For local dev often false; true for Azure
                trustServerCertificate: true // Self-signed certs
            }
        };

        pool = await sql.connect(sqlConfig);
        console.log('Connected to MSSQL');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

const getPool = () => pool;

module.exports = { connectDB, getPool, sql };
