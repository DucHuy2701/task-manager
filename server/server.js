import express from 'express';
import cors from 'cors';
// import db from './db.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    res.send('Server running!');
})

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));