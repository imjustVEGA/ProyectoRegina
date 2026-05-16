import { getConnection } from './db.js';
import sql from 'mssql';

/**
 * 
 * @param {string} query 
 * @param {Array} params 
 * @returns {Promise<Array>} 
 */

export async function runQuery(query, params = []) {
    try {
        const pool = await getConnection();
        const request = pool.request();

        if (params.length > 0) {
            params.forEach((param, index) => {
                request.input(`param${index}`, param);
            });
        }

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error ejecutando la query:", error);
        throw error;
    }
}


export async function obtenerDatos() {
    const query = "select Badgenumber as idempleado, concat(name,' ',lastname) as nombreEmpleado, DEFAULTDEPTID as DepartID,  privilege as rango from USERINFO";
    return await runQuery(query);
}


