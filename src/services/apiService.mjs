import axios from 'axios';
import { parseXml } from './xmlParser.mjs';
import { generateChaveBusca } from '../utils/helpers.mjs';
import { createExcel } from './excelGenerator.mjs';

export async function processUpload(files, apiKey, environment) {
    const baseURL = environment === 'production' ? 'https://nerus-edoc.net' : 'https://novonfeqas.avancoinfo.com.br';
    const endpointURL = `${baseURL}/migracaonfenotas`;

    const fileArray = Array.isArray(files) ? files : [files];
    const results = [];

    for (const file of fileArray) {
        const xmlData = file.data.toString();
        const parsedData = await parseXml(xmlData);

        const infNFe = parsedData.NFe[0].infNFe[0];
        const cnpj = infNFe.emit[0].CNPJ[0];
        const chave = infNFe.Id[0].replace(/^NFe/, '');
        const numeroNf = infNFe.ide[0].nNF[0];
        const dataEmissao = new Date(infNFe.ide[0].dhEmi[0]);
        const chaveBusca = generateChaveBusca(dataEmissao, numeroNf);
        const natOp = infNFe.ide[0].natOp[0];

        const postData = {
            cnpj,
            chave,
            chaveBusca,
            xml: xmlData
        };

        await axios.post(endpointURL, postData, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            }
        });

        results.push({
            chaveNota: chave,
            numeroNota: numeroNf,
            serieNota: infNFe.ide[0].serie[0] || '',
            chaveBusca,
            naturezaOperacao: natOp
        });
    }

    return results;
}
