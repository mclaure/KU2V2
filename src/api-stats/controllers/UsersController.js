'use strict';

const http = require('http')

module.exports.updateUserKudos = (userId, total) => {
  const urlPath = '/api/users/' + userId + '/update/kudosQTY/' + total;
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: urlPath,
    method: 'PUT'
  };

  const req = http.request(options, (res) => {
    console.log('statusCode: ${res.statusCode}');
  });

  req.on('error', (error) => {
    console.error(error);
  })

  req.end();
};