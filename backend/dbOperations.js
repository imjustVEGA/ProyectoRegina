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


export async function obtenerUsuarios() {
    const query = "select Badgenumber as idempleado from USERINFO";
    return await runQuery(query);
}

/*export async function obtenerUsuarioPorId(id) {
    const query = "select Badgenumber as idempleado, concat(name,' ',lastname) as nombreEmpleado, DEFAULTDEPTID as DepartID, privilege as rango from USERINFO where Badgenumber = @param0";
    return await runQuery(query, [id]);
}*/

export async function obtenerDatos() {
    const query = "select Badgenumber as idempleado, concat(name,' ',lastname) as nombreEmpleado, DEFAULTDEPTID as DepartID, privilege as rango from USERINFO";
    return await runQuery(query);
}


