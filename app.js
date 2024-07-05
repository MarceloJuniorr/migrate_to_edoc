const express = require('express');
const fileUpload = require('express-fileupload');
const xml2js = require('xml2js');
const axios = require('axios');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

app.use(express.static('public'));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', async (req, res) => {
    const apiKey = req.body.apiKey;
    const environment = req.body.environment;
    const files = req.files.files;

    console.log('API Key:', apiKey);
    console.log('Environment:', environment);
    console.log('Files:', files);

    if (!apiKey) {
        return res.status(400).send('API Key is required');
    }

    if (!files) {
        return res.status(400).send('No files were uploaded');
    }

    const baseURL = environment === 'production' ? 'https://nerus-edoc.net' : 'https://novonfeqas.avancoinfo.com.br';
    const endpointURL = `${baseURL}/migracaonfenotas`;

    const fileArray = Array.isArray(files) ? files : [files];
    const results = [];

    for (const file of fileArray) {
        const xmlData = file.data.toString();
        console.log('XML Data:', xmlData); // Log the XML data for debugging
        let parsedData;
        try {
            parsedData = await parseXml(xmlData);
        } catch (error) {
            console.error('Error parsing XML:', error.message);
            return res.status(400).send(`Error parsing XML: ${error.message}`);
        }

        console.log('Parsed Data:', JSON.stringify(parsedData, null, 2)); // Log parsed data for debugging

        if (!parsedData.NFe || !parsedData.NFe[0].infNFe || !parsedData.NFe[0].infNFe[0].emit || !parsedData.NFe[0].infNFe[0].ide) {
            console.error('Invalid XML structure');
            return res.status(400).send('Invalid XML structure');
        }

        const infNFe = parsedData.NFe[0].infNFe[0];
        const cnpj = infNFe.emit[0].CNPJ ? infNFe.emit[0].CNPJ[0] : null;
        const chave = infNFe.Id ? infNFe.Id[0].replace(/^NFe/, '') : null;
        const numeroNf = infNFe.ide[0].nNF ? infNFe.ide[0].nNF[0] : null;
        const dataEmissao = infNFe.ide[0].dhEmi ? new Date(infNFe.ide[0].dhEmi[0]) : null;
        const chaveBusca = generateChaveBusca(dataEmissao, numeroNf);
        const natOp = infNFe.ide[0].natOp ? infNFe.ide[0].natOp[0] : null;

        if (!cnpj || !chave || !numeroNf || !dataEmissao || !natOp) {
            console.error('Missing required fields in XML');
            return res.status(400).send('Missing required fields in XML');
        }

        const postData = {
            cnpj,
            chave,
            chaveBusca,
            xml: xmlData
        };

        console.log('Post Data:', postData);

        try {
            await axios.post(endpointURL, postData, {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                }
            });
        } catch (error) {
            console.error('Error posting data:', error.message);
            return res.status(500).send(`Error posting data: ${error.message}`);
        }

        results.push({
            chaveNota: chave,
            numeroNota: numeroNf,
            serieNota: infNFe.ide[0].serie ? infNFe.ide[0].serie[0] : '',
            chaveBusca,
            naturezaOperacao: natOp
        });
    }

    const filePath = await createExcel(results);
    res.download(filePath, 'result.xlsx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
        }
        fs.unlinkSync(filePath);
    });
});

function parseXml(xml) {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser({ 
            explicitArray: true, 
            tagNameProcessors: [xml2js.processors.stripPrefix], 
            mergeAttrs: true 
        });
        parser.parseString(xml, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result.nfeProc);
        });
    });
}

function generateChaveBusca(date, numeroNf) {
    if (!date || !numeroNf) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}${String(numeroNf).padStart(8, '0')}`;
}

async function createExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas Fiscais');
    worksheet.columns = [
        { header: 'Chave da Nota', key: 'chaveNota', width: 40 },
        { header: 'Número da Nota', key: 'numeroNota', width: 20 },
        { header: 'Série da Nota', key: 'serieNota', width: 20 },
        { header: 'Chave de Busca', key: 'chaveBusca', width: 40 },
        { header: 'Natureza da Operação', key: 'naturezaOperacao', width: 30 }
    ];
    worksheet.addRows(data);

    const filePath = path.join(__dirname, 'uploads', `result-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
