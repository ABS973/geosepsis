import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','app.js','engine.js','styles.css','favicon.svg'])await copyFile(file,`dist/${file}`);
console.log('GeoSepsis built to dist/ — no external runtime assets.');
