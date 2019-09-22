'use strict';

const filename = '../logs/api-kudos.log';
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
    level: 'debug',
    format: format.combine(  
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)),   
        transports: [
            new transports.Console({
              level: 'info',
              handleExceptions: true,
              json: false,
              colorize: true,              
              format: format.combine(
                format.colorize(),
                timestamp(),
                prettyPrint(),
                format.printf(
                  info =>
                    `${info.timestamp} ${info.level}: ${info.message}`
                )
              )
            }),
            new transports.File({
              level: 'info',
              handleExceptions: true,
              json: true,
              maxsize: 5242880,
              maxFiles: 50,
              colorize: false,                       
              filename,
              format: format.combine(
                timestamp(),
                prettyPrint(),               
                format.printf(
                  info =>
                    `${info.timestamp} ${info.level}: ${info.message}`
                )
              )
            })
          ],
          exitOnError: false       
});

logger.stream = {
  write: function(message, encoding){
      logger.info(message);
  }
};

module.exports = logger;
module.exports.stream = {
  write: function(message, encoding){
      logger.info(message);
  }
};