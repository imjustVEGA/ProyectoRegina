import 'dotenv/config';
import { runQuery } from './dbOperations.js';

/**
 * Script utilitario para inspeccionar las columnas y tipos de datos del esquema de base de datos.
 * 
 * Funcionalidad:
 * 1. Consulta INFORMATION_SCHEMA.COLUMNS para la tabla `USERINFO`.
 * 2. Consulta INFORMATION_SCHEMA.COLUMNS para la tabla `ADMINS`.
 * 3. Muestra la estructura de campos y tipos de datos en la consola.
 */
async function main() {
    try {
        console.log("USERINFO Columns:");
        const userinfo = await runQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'USERINFO'");
        console.log(userinfo);

        console.log("ADMINS Columns:");
        const admins = await runQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ADMINS'");
        console.log(admins);
    } catch(e) {
        console.error("Error al consultar el esquema:", e);
    }
    process.exit(0);
}

main();

