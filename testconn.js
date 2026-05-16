import sql from 'mssql';
import 'dotenv/config';

import dbConfig from './DBConfig.mjs';

async function verificarConexion() {
    try {
        await sql.connect(dbConfig);

        console.log("Conexión exitosa a SQL Server");

       // const resultado = await sql.query`SELECT * FROM USERINFO`;

        //console.log(resultado.recordset);

    } catch (error) {
        console.error("Error de conexión:");
        console.error(error);
    } finally {
        await sql.close();
    }
}

verificarConexion();
