import sql from "mssql";
import dbConfig from "./DBConfig.mjs";

/**
 * Establece y retorna un pool de conexiones a la base de datos SQL Server.
 * 
 * Utiliza la configuración importada de DBConfig.mjs (servidor, usuario, contraseña, base de datos).
 * Si la conexión es exitosa, devuelve el objeto `pool` para ejecutar consultas.
 * En caso de error, captura la excepción y la imprime en la consola.
 * 
 * @async
 * @function getConnection
 * @returns {Promise<sql.ConnectionPool|undefined>} Retorna el pool de conexión a MSSQL o undefined si falla.
 */
export async function getConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        return pool;
    } catch (error) {
        console.error("Error de conexión:", error);
        throw error;
    }
}