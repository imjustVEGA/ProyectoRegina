import { runQuery } from './dbOperations.js';

async function main() {
    try {
        console.log("USERINFO Columns:");
        const userinfo = await runQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'USERINFO'");
        console.log(userinfo);

        console.log("ADMINS Columns:");
        const admins = await runQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ADMINS'");
        console.log(admins);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
main();
