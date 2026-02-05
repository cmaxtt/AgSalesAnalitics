
const validateTable = async (pool, tableName) => {
    // Basic alphanumeric check to prevent obvious injection characters immediately
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        return false;
    }

    try {
        // Query INFORMATION_SCHEMA to verify existence
        const result = await pool.request()
            .input('tableName', tableName)
            .query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName`);
        
        return result.recordset.length > 0;
    } catch (err) {
        console.error("Table validation error:", err);
        return false;
    }
};

module.exports = { validateTable };
