'use strict';

const http = require('http');
const logger = require('../logger/logger');

module.exports.deleteAllKudos = (userId) => {
  const urlPath = '/api/kudos/del/all/' + userId;

  const options = {
    hostname: 'localhost',
    port: 6500,
    path: urlPath,
    method: 'DELETE'
  };

  const req = http.request(options, (res) => {
    logger.info('[/api/kudos/del/all/] statusCode: ' + res.statusCode);
  });

  req.on('error', (error) => {
    logger.info('[/api/kudos/del/all/] ' + error);
  })

  req.end();
};