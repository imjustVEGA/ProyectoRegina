import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { getUsers, getUserById, runQuery } from './dbOperations.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/users', async (req, res) => {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await getUserById(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
