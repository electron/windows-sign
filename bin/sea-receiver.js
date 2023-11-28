const fs = require('fs-extra');

fs.appendFileSync('run', JSON.stringify(process.argv));
