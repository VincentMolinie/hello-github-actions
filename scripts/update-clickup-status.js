const fs = require('fs');

const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH);
console.log(file);
