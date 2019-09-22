'use strict';

const amqp = require('amqplib/callback_api');
var users = require('./UsersController');
var kudos = require('./KudosController');
const logger = require('../logger/logger');

const rmqSettings = { 
                        url: 'amqp://admin:Password123@HOME',
                        exchange: "ku2-sync-data",
                        kudos: "kudos",
                        users: "users"                        
                    };
                    
module.exports.startReceivingMessages = () => {
    amqp.connect(rmqSettings.url, function(rabbitmqConnectionError, connection) {
        if (rabbitmqConnectionError) throw rabbitmqConnectionError;
            connection.createChannel(function(rabbitmqChannelError, channel) {
                if (rabbitmqChannelError) throw rabbitmqChannelError;
                    //Configure exchange
                    channel.assertExchange(rmqSettings.exchange, 'direct', { durable: false });

                    channel.assertQueue('', { exclusive: true }, 
                        function(queueError, queueObj) {
                            if (queueError) throw queueError;
                                console.log(' [*]  ======= Starting waiting for messages =======');

                                //bindind the exchanges with the Queue
                                channel.bindQueue(queueObj.queue, rmqSettings.exchange, rmqSettings.users);
                                channel.bindQueue(queueObj.queue, rmqSettings.exchange, rmqSettings.kudos);     

                                //Consuming the message
                                channel.consume(queueObj.queue, function(msg) {
                                    var key = msg.fields.routingKey;
                                    var message = msg.content.toString();

                                    logger.info(' [x] ' + key + ': ' + message);
                                    
                                    var info = JSON.parse(message);

                                    if(key == rmqSettings.users)
                                    {
                                        //A users action happened we need to kudos data then
                                        if(info.operation === 'delete')
                                            kudos.deleteAllKudos(info.idDestinatario);
                                        else
                                            logger.info(' [!] kudos => not supported operation');
                                    }
                                    else if (key == rmqSettings.kudos)
                                    {
                                        //A kudos action happened we need to update users data then
                                        if(info.operation === 'add' || info.operation === 'del')
                                            users.updateUserKudos(info.idDestinatario, info.newTotalKudos);
                                        else
                                            logger.info(' [!] users => not supported operation');
                                    }
                                    else 
                                    {
                                        logger.info(' [!] Message ' + key + ' was not found for any action');
                                    }

                                }, {
                                    noAck: false
                                });
                    });
            });
   });
};