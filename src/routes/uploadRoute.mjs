import { Router } from 'express';
import { processUpload } from '../services/apiService.mjs';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const { apiKey, environment } = req.body;
        const files = req.files?.files;

        if (!apiKey) {
            return res.status(400).send('API Key is required');
        }

        if (!files) {
            return res.status(400).send('No files were uploaded');
        }

        const results = await processUpload(files, apiKey, environment);
        const filePath = await createExcel(results);

        res.download(filePath, 'result.xlsx', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error('Error processing upload:', error.message);
        res.status(500).send(`Error processing upload: ${error.message}`);
    }
});

export default router;
