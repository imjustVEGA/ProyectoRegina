import { getConnection } from './db.js';
import sql from 'mssql';

/**
 * Ejecuta una consulta SQL parametrizada en la base de datos SQL Server.
 * 
 * Funcionalidad:
 * 1. Obtiene una conexión activa mediante `getConnection()`.
 * 2. Crea un objeto `request` a partir del pool.
 * 3. Asigna de forma segura los parámetros recibidos (`@param0`, `@param1`, ...) para prevenir inyecciones SQL.
 * 4. Ejecuta la consulta SQL y devuelve el conjunto de registros (`recordset`).
 * 
 * @async
 * @function runQuery
 * @param {string} query - Sentencia SQL a ejecutar.
 * @param {Array} [params=[]] - Arreglo de valores que se enlazarán a los parámetros de la consulta (@param0, @param1, etc.).
 * @returns {Promise<Array<Object>>} Registros obtenidos de la base de datos.
 * @throws {Error} Si ocurre un fallo durante la conexión o ejecución de la consulta.
 */
export async function runQuery(query, params = []) {
    try {
        const pool = await getConnection();
        const request = pool.request();

        // Enlazar cada parámetro de manera segura para evitar inyecciones SQL
        if (params.length > 0) {
            params.forEach((param, index) => {
                request.input(`param${index}`, param);
            });
        }

        // Ejecutar la consulta en la BD y retornar los resultados
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error ejecutando la query:", error);
        throw error;
    }
}

/**
 * Obtiene la lista completa de empleados registrados junto con sus departamentos.
 * 
 * Funcionalidad:
 * - Realiza un INNER JOIN entre la tabla `USERINFO` y `DEPARTMENTS` vinculando por `DEFAULTDEPTID`.
 * - Concatena el nombre y apellido del empleado.
 * - Mapea los campos: ID de empleado (Badgenumber), nombre completo, ID de departamento, nombre del departamento y rango/privilegio.
 * 
 * @async
 * @function obtenerDatos
 * @returns {Promise<Array<Object>>} Lista de objetos con información de cada empleado.
 */
export async function obtenerDatos() {
    const query = "SELECT USERINFO.Badgenumber AS idempleado, CONCAT(USERINFO.name, ' ', USERINFO.lastname) AS nombreEmpleado, USERINFO.DEFAULTDEPTID AS DepartID, DEPARTMENTS.DEPTNAME AS departamento, USERINFO.privilege AS rango FROM USERINFO INNER JOIN DEPARTMENTS ON USERINFO.DEFAULTDEPTID = DEPARTMENTS.DEPTID";
    return await runQuery(query);
}

/**
 * Busca y obtiene la información de un empleado específico mediante su identificador/número de credencial.
 * 
 * Funcionalidad:
 * - Consulta la tabla `USERINFO` cruzada con `DEPARTMENTS`.
 * - Filtra por `USERINFO.Badgenumber` utilizando un parámetro seguro (`@param0`).
 * 
 * @async
 * @function obtenerUsuarios
 * @param {string|number} id - Identificador o número de credencial (Badgenumber) del empleado.
 * @returns {Promise<Array<Object>>} Registro(s) del empleado coincidente.
 */
export async function obtenerUsuarios(id) {
    const query = "SELECT USERINFO.Badgenumber AS idempleado, CONCAT(USERINFO.name, ' ', USERINFO.lastname) AS nombreEmpleado, USERINFO.DEFAULTDEPTID AS DepartID, DEPARTMENTS.DEPTNAME AS departamento, USERINFO.privilege AS rango FROM USERINFO INNER JOIN DEPARTMENTS ON USERINFO.DEFAULTDEPTID = DEPARTMENTS.DEPTID WHERE USERINFO.Badgenumber = @param0";
    return await runQuery(query, [id]);
}

/**
 * Obtiene el historial completo de registros de asistencia y checadas del personal.
 * 
 * Funcionalidad:
 * - Consulta la tabla de eventos de acceso `acc_monitor_log` (`reporteasist`).
 * - Realiza INNER JOIN con `USERINFO` para obtener los datos del empleado.
 * - Realiza INNER JOIN con `DEPARTMENTS` para obtener el área/puesto.
 * - Formatea la fecha en formato 'dd-MM-yyyy' y la hora en 'hh:mm:ss'.
 * - Traduce el tipo de verificación (16: 'Rostro', 1: 'Huella', otro: 'Desconocido').
 * - Traduce el estado del evento (16: 'Entrada', 15: 'Salida', otro: 'Desconocido').
 * - Ordena cronológicamente en orden descendente (los más recientes primero).
 * 
 * @async
 * @function obtenerAsistencias
 * @returns {Promise<Array<Object>>} Lista de registros de asistencia detallados.
 */
export async function obtenerAsistencias() {
    const query = "select reporteasist.pin as idEmpleado, concat(usuario.name, ' ', usuario.lastname) as nomEmpleado, departamento.DEPTNAME as puesto, format(reporteasist.time,'yyyy-MM-dd') as fecha, format(reporteasist.time,'hh:mm:ss') as hora, case when reporteasist.verified = 16 then 'Rostro' when reporteasist.verified = 1 then 'Huella' else 'Desconocido' end as verificacion, case when reporteasist.verified = 16 then 'Entrada' when reporteasist.verified = 15 then 'Salida' else 'Desconocido' end as estado, device_name as dispotivo, device_name as dispositivo from acc_monitor_log as reporteasist inner join USERINFO as usuario on reporteasist.pin = usuario.Badgenumber inner join DEPARTMENTS as departamento on usuario.DEFAULTDEPTID=departamento.DEPTID order by reporteasist.time desc;";
    return await runQuery(query);
}

/**
 * Busca un usuario administrador en la tabla `ADMINS` por su nombre de usuario.
 * 
 * Funcionalidad:
 * - Ejecuta una consulta segura con parámetro `@param0` para buscar credenciales en la tabla `ADMINS`.
 * - Se utiliza principalmente durante el proceso de autenticación e inicio de sesión.
 * 
 * @async
 * @function buscarUsuario
 * @param {string} username - Nombre de usuario a buscar.
 * @returns {Promise<Array<Object>>} Arreglo con los datos del administrador si existe (incluyendo contraseña encriptada).
 */
export async function buscarUsuario(username) {
    const query = "SELECT * FROM ADMINS WHERE username = @param0";
    return await runQuery(query, [username]);
}

/**
 * Obtiene el catálogo de departamentos disponibles en la empresa.
 * 
 * Funcionalidad:
 * - Consulta la tabla `DEPARTMENTS` y extrae el identificador (`DEPTID`) y el nombre (`DEPTNAME`).
 * - Se utiliza para poblar listas desplegables (select) en formularios y filtros.
 * 
 * @async
 * @function obtenerDepartamentos
 * @returns {Promise<Array<Object>>} Lista de departamentos con `id_departamento` y `nombre_departamento`.
 */
export async function obtenerDepartamentos() {
    const query = "SELECT DEPTID AS id_departamento, DEPTNAME AS nombre_departamento FROM DEPARTMENTS";
    return await runQuery(query);
}

/**
 * Registra un nuevo empleado en el sistema tanto a nivel de personal como de credenciales de acceso.
 * 
 * Funcionalidad:
 * 1. Extrae los datos del objeto recibido (`idemployee`, `name`, `username`, `department`, `password`).
 * 2. Encripta de forma segura la contraseña usando `bcrypt` con 10 rondas de salteo.
 * 3. Separa el nombre completo recibido en primer nombre y apellidos.
 * 4. Inserta los datos generales del empleado en la tabla `USERINFO` (Badgenumber, name, lastname, DEFAULTDEPTID).
 * 5. Inserta el usuario y la contraseña encriptada en la tabla `ADMINS` para permitir el inicio de sesión.
 * 6. Retorna un mensaje de confirmación de registro exitoso.
 * 
 * @async
 * @function crearEmpleado
 * @param {Object} datos - Datos del nuevo empleado.
 * @param {string} datos.idemployee - Número de empleado (Badgenumber).
 * @param {string} datos.name - Nombre completo del empleado.
 * @param {string} datos.username - Nombre de usuario para el inicio de sesión.
 * @param {string|number} datos.department - ID del departamento asignado.
 * @param {string} datos.password - Contraseña en texto plano para encriptar.
 * @returns {Promise<Object>} Objeto con mensaje descriptivo de la operación (`{ message: "..." }`).
 */
export async function crearEmpleado(datos) {
    // 1. Extraer los datos enviados desde el formulario
    const { idemployee, name, username, department, password } = datos;

    // 2. Encriptar la contraseña mediante bcrypt antes de guardarla
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Separar nombre y apellido por el primer espacio
    const partesNombre = name.split(' ');
    const nombre = partesNombre[0];
    const apellido = partesNombre.slice(1).join(' ');

    // 4. Insertar los datos del empleado en la tabla de información de personal (USERINFO)
    const queryUser = "INSERT INTO USERINFO (Badgenumber, name, lastname, DEFAULTDEPTID) VALUES (@param0, @param1, @param2, @param3)";
    await runQuery(queryUser, [idemployee, nombre, apellido, department]);

    // 5. Insertar las credenciales en la tabla de administradores (ADMINS) para permitir el login
    const queryAdmin = "INSERT INTO ADMINS (username, password) VALUES (@param0, @param1)";
    await runQuery(queryAdmin, [username, hashedPassword]);

    return { message: "Empleado registrado exitosamente" };
}
