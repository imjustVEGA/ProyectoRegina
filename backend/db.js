import sql from "mssql";
import dbConfig from "./DBConfig.mjs";

export async function getConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        return pool;
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}