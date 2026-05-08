const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'c:\\Work\\WeduPay\\.docs\\WeduuPay Business Plan and Direction.PDF';
const outPath = 'tmp/weduuplan.txt';

(async () => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    fs.writeFileSync(outPath, data.text, 'utf8');
    console.log('EXTRACT_OK');
  } catch (err) {
    console.error('EXTRACT_ERR', err);
    process.exit(2);
  }
})();
