const fs = require('fs');

const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
const eventPayload = JSON.parse(file);

if (eventPayload && eventPayload.pull_request && eventPayload.pull_request.title) {
  if (eventPayload.pull_request.title.includes('(#')) {
    const index = eventPayload.pull_request.title.indexOf('(#') + 2;
    const clickUpTag = eventPayload.pull_request.title.substring(index, index + 6);

    console.log(' =========== Click Up Tag', clickUpTag, '=============');
  }
}
console.log(file);
