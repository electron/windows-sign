const { createSeaSignTool } = require('../dist/cjs');
const path = require('path');

async function main() {
  const result = await createSeaSignTool({
    path: path.join(__dirname, '..', 'tmp', 'signtool.exe'),
    receiver: path.join(__dirname, 'sea-receiver.js')
  });

  console.log(result);
}

main();
