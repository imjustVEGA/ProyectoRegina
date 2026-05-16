import 'dotenv/config';
import { obtenerDatos } from './dbOperations.js';
import sql from 'mssql';

async function mostrarDatos() {
    try {
        const datos = await obtenerDatos();
        console.log("Datos obtenidos de la base de datos:");
        console.log(datos);
    } catch (error) {
        console.error("Error al obtener los datos:", error);
    } finally {
        await sql.close();
    }
}

mostrarDatos();
