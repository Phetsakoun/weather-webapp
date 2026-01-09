const path = require('path');
const cwd = path.join(__dirname, 'backend');
process.chdir(cwd);
console.log('CWD:', process.cwd());
require('./backend/tmp_seed.js');
