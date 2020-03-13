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
  'closed',
];

function getClickUpTaskIdFromTitle(pullRequestTitle) {
  const index = pullRequestTitle.indexOf('(#') + 2;

  const clickUpTag = pullRequestTitle.substring(index);
  return clickUpTag.substring(0, clickUpTag.indexOf(')'));
}

async function updateStatusIfNecessary(tagId, currentStatus, targetStatus) {
  const currentStatusOrder = statusOrders.indexOf(currentStatus);
  const targetStatusOrder = statusOrders.indexOf(targetStatus);

  if (currentStatusOrder < targetStatusOrder) {
    await axios({
      method: 'PUT',
      url: `https://api.clickup.com/api/v2/task/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: CLICKUP_API_KEY,
      },
      data: {
        status: targetStatus,
      },
    });

    return true;
  }

  return false;
}

function isWaitingForReview() {
  if (eventPayload.pull_request
    && eventPayload.pull_request.requested_reviewers
    && eventPayload.pull_request.requested_reviewers.length
    && eventPayload.pull_request.assignees
    && eventPayload.pull_request.assignees.length
  ) {
    const reviewerLogins = eventPayload.pull_request.requested_reviewers.map(
      (reviewer) => reviewer.login,
    );
    const assigneeLogins = eventPayload.pull_request.assignees.map(
      (assignee) => assignee.login,
    );

    return assigneeLogins.some(
      (assigneeLogin) => reviewerLogins.some(
        (reviewerLogin) => reviewerLogin === assigneeLogin,
      ),
    );
  }

  return false;
}

function isInCodeReview() {
  return eventPayload && !!eventPayload.review;
}

function isApproved() {
  if (eventPayload && eventPayload.review) {
    return eventPayload.review.state === 'APPROVED';
  }
  return false;
}

if (eventPayload && eventPayload.pull_request && eventPayload.pull_request.title) {
  if (eventPayload.pull_request.title.includes('(#')) {
    const clickUpTaskId = getClickUpTaskIdFromTitle(eventPayload.pull_request.title);

    let targetStatus = 'doing';
    if (isWaitingForReview()) {
      targetStatus = 'waiting for review';

      if (isInCodeReview()) {
        targetStatus = 'in code review';
      }
    }

    if (isApproved()) {
      targetStatus = 'to release';
    }

    axios({
      method: 'GET',
      url: `https://api.clickup.com/api/v2/task/${clickUpTaskId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: CLICKUP_API_KEY,
      },
    }).then(async (response) => {
      await updateStatusIfNecessary(clickUpTaskId, response.data.status.status, targetStatus);
    });
  }
}
