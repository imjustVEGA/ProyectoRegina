import 'dotenv/config';
import { runQuery } from '../dbOperations.js';

async function inspectDB() {
    try {
        console.log("Listing tables...");
        const tables = await runQuery("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log(JSON.stringify(tables, null, 2));

        if (tables.some(t => t.TABLE_NAME === 'CHECKINOUT')) {
            console.log("\nStructure of CHECKINOUT:");
            const cols = await runQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CHECKINOUT'");
            console.log(JSON.stringify(cols, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectDB();
