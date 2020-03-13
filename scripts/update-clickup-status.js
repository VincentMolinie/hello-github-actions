const fs = require('fs');
const axios = require('axios');
const CLICKUP_API_KEY = 'pk_4518205_4TA4J4EYV5R2LSP67ZK7K5KQ63S79MTG';

const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
const eventPayload = JSON.parse(file);

if (eventPayload && eventPayload.pull_request && eventPayload.pull_request.title) {
  if (eventPayload.pull_request.title.includes('(#')) {
    const index = eventPayload.pull_request.title.indexOf('(#') + 2;
    const clickUpTag = eventPayload.pull_request.title.substring(index, index + 6);

    console.log(' =========== Click Up Tag', clickUpTag, '=============');

    axios({
      method: 'GET',
      url: `https://api.clickup.com/api/v2/task/${clickUpTag}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CLICKUP_API_KEY,
      }
    }).then(response => {
      console.log('response', response);
    })
  }
}
console.log(file);
