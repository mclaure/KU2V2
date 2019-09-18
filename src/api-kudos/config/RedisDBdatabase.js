var redis = require('redis');
var redisdb = redis.createClient(6379,'127.0.0.1');

redisdb.on('connect', function() {
  console.log('Redis client connected');
});

redisdb.on('error', function (err) {
  console.log('Something went wrong using REDIS : ' + err);
});

module.exports = redisdb;