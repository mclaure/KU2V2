'use strict';
const amqp = require('amqplib/callback_api');

const rmqSettings = { 
                        url: 'amqp://admin:Password123@HOME',
                        exchange: "sync-data",
                        key: "kudos"
                    };

var sendMessage = function(message) {
                //Sent the message for update
                amqp.connect(rmqSettings.url, function(rabbitmqConnectionError, connection) {
                    if (rabbitmqConnectionError) throw rabbitmqConnectionError;
                        connection.createChannel(function(rabbitmqChannelError, channel) {
                            if (rabbitmqChannelError) throw rabbitmqChannelError;
                            //Configure exchange
                            channel.assertExchange(rmqSettings.exchange, 'direct', { durable: false });
                            //publish the message
                            channel.publish(rmqSettings.exchange, rmqSettings.key, Buffer.from(message));
                            //Log the event
                            console.log(" [x] Message sent %s: '%s'", rmqSettings.key, message);
                    });

                    setTimeout(function() { connection.close(); }, 1000);
                });
            };

module.exports.sendMessage = sendMessage;