// src/utils/notificationQueue.js
const PQueue = require('p-queue');

const queue = new PQueue({ concurrency: 2 });

module.exports = queue;
// This module exports a PQueue instance with a concurrency of 2.
// This allows you to add tasks to the queue that will be processed concurrently,   