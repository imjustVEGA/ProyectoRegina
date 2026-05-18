import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { runQuery, obtenerUsuarios, obtenerDatos } from './dbOperations.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/users', async (req, res) => {
    try {
        const users = await obtenerDatos();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los datos' });
    }
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await obtenerUsuarios(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
    console.log(id);
});



  


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



