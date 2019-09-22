'use strict';

const http = require('http');
const logger = require('../logger/logger');

module.exports.updateUserKudos = (userId, total) => {
  const urlPath = '/api/users/' + userId + '/update/kudosQTY/' + total;
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: urlPath,
    method: 'PUT'
  };

  const req = http.request(options, (res) => {
    logger.info('[' + urlPath +'] statusCode: ' + res.statusCode);
  });

  req.on('error', (error) => {
    logger.info('[' + urlPath +'] error: ' + error);
  })

  req.end();
};