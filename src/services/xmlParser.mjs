import xml2js from 'xml2js';

export function parseXml(xml) {
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
