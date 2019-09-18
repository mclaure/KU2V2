'use strict';

const http = require('http')

module.exports.deleteAllKudos = (userId) => {
  const urlPath = '/api/kudos/del/all/' + userId;

  const options = {
    hostname: 'localhost',
    port: 6500,
    path: urlPath,
    method: 'DELETE'
  };

  const req = http.request(options, (res) => {
    console.log('statusCode: ${res.statusCode}');
  });

  req.on('error', (error) => {
    console.error(error);
  })

  req.end();
};