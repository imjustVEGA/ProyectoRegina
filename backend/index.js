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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto_para_desarrollo';

// Endpoint de login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await buscarUsuario(username);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        const user = users[0];
        const passwordCorrecta = await bcrypt.compare(password, user.password);

        if (passwordCorrecta) {
            // Credenciales correctas, generar token
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

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // El formato esperado es "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token o el formato es incorrecto.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payloadDecodificado = jwt.verify(token, JWT_SECRET);
        req.user = payloadDecodificado; // Guardamos los datos del usuario en la request
        next(); // Continuar a la ruta solicitada
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

app.get('/users', verificarToken, async (req, res) => {
    try {
        const users = await obtenerDatos();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

app.get('/asistencias', verificarToken, async (req, res) => {
    try {
        const asistencias = await obtenerAsistencias();
        res.json(asistencias);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las asistencias' });
    }
});

app.get('/users/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await obtenerUsuarios(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
    console.log(id);
});


app.get('/api/departamentos', async (req, res) => {
    try {
        const departamentos = await obtenerDepartamentos();
        res.json(departamentos);
    } catch (error) {
        console.error("Error obteniendo departamentos:", error);
        res.status(500).json({ error: 'Error al obtener los departamentos' });
    }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const resultado = await crearEmpleado(req.body);
        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error al crear empleado:", error);
        res.status(500).json({ error: 'Error al registrar el empleado' });
    }
});

// Servir archivos estáticos del frontend construido en producción
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Cualquier otra ruta redirige al frontend (para Single Page Applications o manejo en el cliente)
app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'Login.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
