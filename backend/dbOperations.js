import { getConnection } from './db.js';
import sql from 'mssql';

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
    const query = "SELECT USERINFO.Badgenumber AS idempleado, CONCAT(USERINFO.name, ' ', USERINFO.lastname) AS nombreEmpleado, USERINFO.DEFAULTDEPTID AS DepartID, DEPARTMENTS.DEPTNAME AS departamento, USERINFO.privilege AS rango FROM USERINFO INNER JOIN DEPARTMENTS ON USERINFO.DEFAULTDEPTID = DEPARTMENTS.DEPTID";
    return await runQuery(query);
}



