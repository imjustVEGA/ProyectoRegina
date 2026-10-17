import 'dotenv/config';
import { runQuery } from '../dbOperations.js';

/**
 * Script de diagnóstico para listar todas las tablas base y verificar la estructura de CHECKINOUT.
 * 
 * Funcionalidad:
 * 1. Consulta INFORMATION_SCHEMA.TABLES para obtener todas las tablas del tipo 'BASE TABLE'.
 * 2. Imprime la lista de tablas en formato JSON con indentación.
 * 3. Si existe la tabla `CHECKINOUT`, consulta e imprime sus columnas y tipos de datos.
 */
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
        console.error("Error durante la inspección de la base de datos:", err);
    } finally {
        process.exit();
    }
}

inspectDB();

