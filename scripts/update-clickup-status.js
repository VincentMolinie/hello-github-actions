const fs = require('fs');
const axios = require('axios');
const CLICKUP_API_KEY = 'pk_4518205_4TA4J4EYV5R2LSP67ZK7K5KQ63S79MTG';

const file = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
const eventPayload = JSON.parse(file);

const statusOrders = [
  'to do',
  'doing',
  'waiting for review',
  'in functionnal test',
  'in code review',
  'to release',
  'released',
];

async function updateStatusIfNecessary(tagId, currentStatus, targetStatus) {
  const currentStatusOrder = statusOrders.indexOf(currentStatus);
  const targetStatusOrder = statusOrders.indexOf(targetStatus);

  console.log('currentStatusOrder', currentStatusOrder);
  console.log('targetStatusOrder', targetStatusOrder);

  if (currentStatusOrder < targetStatusOrder) {
    await axios({
      method: 'PUT',
      url: `https://api.clickup.com/api/v2/task/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CLICKUP_API_KEY,
      },
      data: {
        status: targetStatus,
      },
    }).then(response => {
      console.log('PUT Update', response.data);
    });

    return true;
  }

  return false;
}

if (eventPayload.pull_request
  && eventPayload.pull_request.requested_reviewers
  && eventPayload.pull_request.requested_reviewers.length
  && eventPayload.pull_request.assignees
  && eventPayload.pull_request.assignees.length
) {
  const reviewerLogins = eventPayload.pull_request.requested_reviewers.map(
    reviewer => reviewer.login
  );
  const assigneeLogins = eventPayload.pull_request.assignees.map(
    assignee => assignee.login
  );

  const isInReview = assigneeLogins.some(assigneeLogin => reviewerLogins.some(reviewerLogin => reviewerLogin === assigneeLogin));

  console.log(' ===== isInReview', isInReview);
}

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
    }).then(async response => {
      console.log('_______________ response\n', response.data);
      console.log('_______________ status\n', response.data && response.data.status && response.data.status.status);
      if (response.data.status.status) {
        await updateStatusIfNecessary(clickUpTag, response.data.status.status, 'in code review');
      }
    });
  }
}
console.log(file);
