import bcrypt from 'bcrypt';
const password = 'admin123';

/**
 * Función de prueba para verificar el funcionamiento de encriptación y comparación de bcrypt.
 * 
 * Funcionalidad:
 * 1. Genera un hash seguro para la contraseña de prueba 'admin123' con costo 10.
 * 2. Compara la contraseña en texto plano contra el hash generado usando `bcrypt.compare`.
 * 3. Imprime en consola el hash y el resultado booleano de la coincidencia (true/false).
 */
async function test() {
    const hash = await bcrypt.hash(password, 10);
    console.log('HASH:', hash);
    const match = await bcrypt.compare(password, hash);
    console.log('MATCH:', match);
}

test();
