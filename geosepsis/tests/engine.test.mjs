import '../engine.js';
import './suite.js';
const result=globalThis.runGeoTests();
for(const line of result.results)console.log(line);
console.log(`${result.passed} checks passed; ${result.failed} failed.`);
if(result.failed)process.exitCode=1;
