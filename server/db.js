
const sql = require('mssql');

let pool = null;

const connectDB = async (config) => {
    try {
        if (pool) {
            await pool.close();
        }

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
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        };

        // If localhost, force 127.0.0.1 to avoid TCP/Named Pipes ambiguity
        if (sqlConfig.server === 'localhost') {
            sqlConfig.server = '127.0.0.1';
        }

        // Add correct port logic:
        // If it's a named instance (HAS BACKSLASH), DO NOT SET PORT. Let SQL Browser handle it.
        // If it's a standard IP or localhost, DEFAULT TO 1433 if not specified.
        if (!sqlConfig.server.includes('\\')) {
            sqlConfig.port = 1433;
        }

        console.log(`Connecting to: ${sqlConfig.server} (${sqlConfig.port ? sqlConfig.port : 'Dynamic Port'}) User: ${sqlConfig.user}`);

        pool = await sql.connect(sqlConfig);
        console.log('Connected to MSSQL');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

const initQueryTables = async () => {
    try {
        if (!pool) return;
        const request = pool.request();

        // 1. QueryHistory Table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QueryHistory' and xtype='U')
            CREATE TABLE QueryHistory (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                QueryText NVARCHAR(MAX),
                GeneratedSQL NVARCHAR(MAX),
                Timestamp DATETIME DEFAULT GETDATE()
            );
        `);

        // 2. QueryFavorites Table
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QueryFavorites' and xtype='U')
            CREATE TABLE QueryFavorites (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                QueryText NVARCHAR(MAX),
                GeneratedSQL NVARCHAR(MAX),
                Note NVARCHAR(255),
                Timestamp DATETIME DEFAULT GETDATE()
            );
        `);
        console.log("Query History & Favorites tables initialized.");
    } catch (err) {
        console.error("Failed to init query tables:", err);
    }
};

const getPool = () => pool;

module.exports = { connectDB, getPool, sql, initQueryTables };
