import express from 'express';
import fileUpload from 'express-fileupload';
import uploadRoute from './routes/uploadRoute.mjs';

const app = express();
const PORT = 4000;

app.use(express.static('public'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/upload', uploadRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
