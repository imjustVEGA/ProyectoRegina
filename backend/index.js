import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { runQuery, obtenerUsuarios, obtenerDatos, obtenerAsistencias, buscarUsuario, obtenerDepartamentos, crearEmpleado } from './dbOperations.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialización de la aplicación Express y puerto de escucha
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares globales
app.use(cors()); // Habilita Cross-Origin Resource Sharing para peticiones desde el frontend
app.use(express.json()); // Parsea el cuerpo de las peticiones entrantes en formato JSON

// Clave secreta para firmar y verificar tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto_para_desarrollo';

/**
 * Endpoint de Autenticación / Inicio de Sesión (POST /login)
 * 
 * Funcionalidad:
 * 1. Recibe `username` y `password` desde el cuerpo de la petición.
 * 2. Consulta la base de datos para buscar al usuario en la tabla ADMINS.
 * 3. Si el usuario no existe, responde con código 401 (No autorizado).
 * 4. Si existe, compara la contraseña en texto plano con el hash almacenado mediante `bcrypt.compare`.
 * 5. Si la contraseña coincide, genera un token JWT firmado con vigencia de 8 horas y lo retorna.
 * 6. Si la contraseña no coincide, responde con código 401.
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await buscarUsuario(username);
        
        // Verificar si el usuario existe en la base de datos
        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        const user = users[0];
        // Comparar contraseña ingresada con el hash encriptado
        const passwordCorrecta = await bcrypt.compare(password, user.password);

        if (passwordCorrecta) {
            // Generar token JWT con payload (username, role) y expiración de 8 horas
            const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ mensaje: 'Autenticación exitosa', token: token });
        } else {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * Middleware de Seguridad para la Verificación de Tokens JWT
 * 
 * Funcionalidad:
 * 1. Extrae la cabecera 'authorization' de la petición HTTP.
 * 2. Valida que exista y comience con el prefijo 'Bearer '.
 * 3. Extrae la cadena del token y la valida usando `jwt.verify` y `JWT_SECRET`.
 * 4. Si es válido, adjunta el payload decodificado a `req.user` y permite continuar al siguiente handler (`next()`).
 * 5. Si es inválido o expiró, interrumpe el flujo y responde con error 401.
 * 
 * @function verificarToken
 * @param {express.Request} req - Objeto de petición HTTP.
 * @param {express.Response} res - Objeto de respuesta HTTP.
 * @param {express.NextFunction} next - Función para transferir el control al siguiente middleware/controlador.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Validar presencia y formato del encabezado de autorización
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token o el formato es incorrecto.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar firma y tiempo de validez del token
        const payloadDecodificado = jwt.verify(token, JWT_SECRET);
        req.user = payloadDecodificado; // Adjuntar información del usuario decodificado a la request
        next(); // Continuar a la ruta protegida solicitada
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

/**
 * Endpoint Protegido: Obtener lista de Empleados (GET /users)
 * Requiere autenticación JWT (`verificarToken`).
 * Retorna todos los empleados con sus nombres, departamentos y privilegios.
 */
app.get('/users', verificarToken, async (req, res) => {
    try {
        const users = await obtenerDatos();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

/**
 * Endpoint Protegido: Obtener Historial de Asistencias (GET /asistencias)
 * Requiere autenticación JWT (`verificarToken`).
 * Retorna las checadas y accesos registrados en el sistema biométrico.
 */
app.get('/asistencias', verificarToken, async (req, res) => {
    try {
        const asistencias = await obtenerAsistencias();
        res.json(asistencias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las asistencias' });
    }
});

/**
 * Endpoint Protegido: Obtener Empleado por ID (GET /users/:id)
 * Requiere autenticación JWT (`verificarToken`).
 * Recibe el parámetro `:id` en la URL y busca el empleado correspondiente.
 */
app.get('/users/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await obtenerUsuarios(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

/**
 * Endpoint Público: Catálogo de Departamentos (GET /api/departamentos)
 * Retorna el listado de departamentos para cargar en los elementos select del frontend.
 */
app.get('/api/departamentos', async (req, res) => {
    try {
        const departamentos = await obtenerDepartamentos();
        res.json(departamentos);
    } catch (error) {
        console.error("Error obteniendo departamentos:", error);
        res.status(500).json({ error: 'Error al obtener los departamentos' });
    }
});

/**
 * Endpoint de Registro de Empleados (POST /api/empleados)
 * Recibe los datos del empleado (número de empleado, nombre, usuario, departamento, password)
 * y los registra en las tablas USERINFO y ADMINS.
 */
app.post('/api/empleados', async (req, res) => {
    try {
        const resultado = await crearEmpleado(req.body);
        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error al crear empleado:", error);
        res.status(500).json({ error: 'Error al registrar el empleado' });
    }
});app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



