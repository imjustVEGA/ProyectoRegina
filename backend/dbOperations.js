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

export async function obtenerUsuarios(id) {
    const query = "SELECT USERINFO.Badgenumber AS idempleado, CONCAT(USERINFO.name, ' ', USERINFO.lastname) AS nombreEmpleado, USERINFO.DEFAULTDEPTID AS DepartID, DEPARTMENTS.DEPTNAME AS departamento, USERINFO.privilege AS rango FROM USERINFO INNER JOIN DEPARTMENTS ON USERINFO.DEFAULTDEPTID = DEPARTMENTS.DEPTID WHERE USERINFO.Badgenumber = @param0";
    return await runQuery(query, [id]);
}

export async function obtenerAsistencias() {
    const query = "select reporteasist.pin as idEmpleado, concat(usuario.name, ' ', usuario.lastname) as nomEmpleado, departamento.DEPTNAME as puesto, format(reporteasist.time,'dd-MM-yyy') as fecha, format(reporteasist.time,'hh:mm:ss') as hora, case when reporteasist.verified = 16 then 'Rostro' when reporteasist.verified = 1 then 'Huella' else 'Desconocido' end as verificacion, case when reporteasist.verified = 16 then 'Entrada' when reporteasist.verified = 15 then 'Salida' else 'Desconocido' end as estado, device_name as dispotivo from acc_monitor_log as reporteasist inner join USERINFO as usuario on  reporteasist.pin = usuario.Badgenumber inner join DEPARTMENTS as departamento on usuario.DEFAULTDEPTID=departamento.DEPTID order by reporteasist.time desc;";
    return await runQuery(query);
}

export async function buscarUsuario(username) {
    const query = "SELECT * FROM ADMINS WHERE username = @param0";
    return await runQuery(query, [username]);
}
