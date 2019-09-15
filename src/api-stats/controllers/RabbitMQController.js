'use strict';

const amqp = require('amqplib/callback_api');
var kudos = require('./MongoDBController');
var users = require('./MySQLController');

const rmqSettings = { 
                        url: 'amqp://admin:Password123@HOME',
                        exchange: "sync-data",
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

                                    console.log(" [x] %s: '%s'", key, message);
                                    
                                    var info = JSON.parse(message);

                                    if(key == rmqSettings.users)
                                    {
                                        //A users action happened we need to kudos data then
                                        if(info.operation === 'delete')
                                            kudos.deleteAllKudos(info.idDestinatario);
                                        else
                                            console.log(' [!] kudos => not supported operation');
                                    }
                                    else if (key == rmqSettings.kudos)
                                    {
                                        //A kudos action happened we need to update users data then
                                        if(info.operation === 'add' || info.operation === 'delete')
                                            users.updateUserKudos(info.idDestinatario, info.newTotalKudos);
                                        else
                                            console.log(' [!] users => not supported operation');
                                    }
                                    else 
                                    {
                                        console.log(" [!] Message key '%s' was not found for any action", key);
                                    }

                                }, {
                                    noAck: false
                                });
                    });
            });
   });
};