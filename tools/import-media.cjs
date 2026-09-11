// Lossy web copies only; source photographs and sponsor artwork are never changed.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const sources = [
  ['IMG_9393.JPG', 'preopening-badminton'],
  ['1I5A0059.JPG', 'preopening-futsal'],
  ['3P1A2119.JPG', 'preopening-volleyball'],
  ['1D2A1828.JPG', 'preopening-basketball'],
  ['DSC_6784.JPG', 'preopening-basketball-shot'],
  ['L1000987.JPG', 'opening-hosts'],
  ['L1000991.JPG', 'opening-audience'],
  ['IMG_0331.JPG', 'week-badminton'],
  ['1D2A8364.JPG', 'week-speech'],
  ['IMG_3387.JPG', 'week-futsal'],
  ['_DSC8824.JPG', 'week-volleyball'],
  ['IMG_0537.JPG', 'closing-night']
];
(async () => {
  const input = process.argv[2];
  if (!input) throw new Error('Pass the folder containing the supplied images.');
  await fs.mkdir('assets/photos', { recursive: true });
  await fs.mkdir('assets/sponsors', { recursive: true });
  for (const [file, name] of sources) {
    const result = await sharp(path.join(input, file)).rotate()
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }).toFile('assets/photos/' + name + '.webp');
    console.log(name, result.width + 'x' + result.height, result.size + ' bytes');
  }
  await fs.copyFile(path.join(input, 'THE PREMIERE 2027 ASTRA AETERNA SPONSOR PROPOSAL ENGLISH.png'), 'assets/sponsors/previous-sponsors-main.png');
  await fs.copyFile(path.join(input, 'image-removebg-preview (5).png'), 'assets/sponsors/previous-sponsors-supporting.png');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
