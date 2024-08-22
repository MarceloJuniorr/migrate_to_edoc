import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createExcel(data) {
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

    const filePath = path.join(__dirname, '../../uploads', `result-${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}
