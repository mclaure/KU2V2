'use strict';

const redisdb = require("../config/RedisDBdatabase");
const rmq = require("./RabbitMQController");
const opts = {
    errorEventName:'error',
    logDirectory:'../../logfiles/api-kudos',
    fileNamePattern:'api-kudos-<DATE>.log',
    dateFormat:'YYYYMMDDHHmmss',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
};
const log = require('simple-node-logger').createRollingFileLogger(opts);

exports.add_kudos = (req, res, next) => {               
    var id = req.body.id || 0;
    var idRemitente = req.body.idRemitente || 0;
    var idDestinatario = req.body.idDestinatario || 0;                
    var fecha = req.body.fecha || '';
    var lugar = req.body.lugar || '';
    var tema = req.body.tema || '';     
    var texto = req.body.texto  || '';              
    var newKey = 'kudos:' + id;
    
    //Check if the desired id existi or not
    if (redisdb.exists(newKey,  function(err, reply) {
        if(err) log.info('[/api/kudos/add] error:', err);   
        
        if (reply == 1) {
            log.info('[/api/kudos/add] key ', newKey, ' already exists');   
            res.status(303).json( { idAlreadyExists: true });
        }
        else 
        {
            //If the key is valid created the hash
            redisdb.hset(newKey, 'id', id);
            redisdb.hset(newKey, 'idRemitente', idRemitente);
            redisdb.hset(newKey, 'idDestinatario', idDestinatario);
            redisdb.hset(newKey, 'fecha', fecha);
            redisdb.hset(newKey, 'lugar', lugar);     
            redisdb.hset(newKey, 'tema', tema);     
            redisdb.hset(newKey, 'texto', texto);  

            var secKey = 'idDestinatario:' + idDestinatario + ':totalKudos';

            if (redisdb.exists(secKey,  function(err, reply) {
                if(err) log.info('[/api/kudos/add] error:', err);  

                if (reply == 1) {
                    log.info('[/api/kudos/add] key ', secKey, ' already exists incr by 1');   
                    redisdb.incr(secKey);
                }
                else 
                {
                    log.info('[/api/kudos/add] key ', secKey, ' already exists initializing with 1');  
                    redisdb.set(secKey,1);   
                }  

                log.info('[/api/kudos/add] key ', secKey, ' was successfully created');
                
                redisdb.get(secKey,  function(err, reply) {
                    var total = parseInt(reply);
                    var message = JSON.stringify({ operation: "add", idDestinatario: idDestinatario, newTotalKudos: total});
                    rmq.sendMessage(message);

                    res.status(200).json( { kudosCreated: true });     
                });      
            }));  
        }              
    }));
};

exports.del_kudos = (req, res, next) => {               
    const idKudos = parseInt(req.params.id, 10) || 0;          
    var delKey = 'kudos:' + idKudos;
    
    if (redisdb.exists(delKey,  function(err, reply) {
        if(err) log.info('[/api/kudos/del] error: ', err);   
        
        if (reply == 1) {

            redisdb.hget(delKey, 'idDestinatario', function(err, reply) {
                if(err) log.info('[/api/kudos/del] error: ', err);  

                var secKey = 'idDestinatario:' + reply + ':totalKudos';
                
                if (redisdb.exists(secKey, function(err, check) {

                    if(check == 1)
                    {
                        redisdb.decr(secKey);
                        log.info('[/api/kudos/del] key ', secKey, ' was decrement by 1'); 

                        redisdb.hget(delKey, "idDestinatario", function(err, data) { 
                            var idDestinatario = parseInt(data);
                            
                            redisdb.del(delKey); 
                            log.info('[/api/kudos/del] key ', delKey, ' was deleted');   
                            
                            redisdb.get(secKey, function(err, reply) { 
                                var total = parseInt(reply);
                                var message = JSON.stringify({ operation: "del", idDestinatario: idDestinatario, "newTotalKudos": total });

                                rmq.sendMessage(message);
                                res.status(303).json( { kudosDeleted: true });
                            });
                        });
                    }
                    else
                    {
                        log.info('[/api/kudos/del] idDestinatario ', secKey, ' was Not Found');                          
                    }
                }));
            });
        }
        else 
        {
            log.info('[/api/kudos/del] key ', delKey, ' was not found'); 
            res.status(303).json( { notFound: true }); 
        }              
    }));
};

exports.list_kudos = (req, res, next) => {
    const allPromises = [];
    var startPage = parseInt(req.query.startPage) || 1;
    var pageSize = parseInt(req.query.pageSize) || 5;

    if(pageSize < 0 || pageSize === 0) {
        log.info('[/api/kudos/list] Invalid pageSize ', pageSize);
        var response = {"error" : true, "message" : "invalid page number, should start with 1"};
        return res.json(response);
    }     
  
    var skip  = pageSize * (startPage - 1);
    var limit = pageSize;

    redisdb.scan('0', 'MATCH', 'kudos:*', 'COUNT', '1000', function(err, allKudos){
        if(err) throw err;

        log.info('[/api/kudos/list] start scanning kudos list');

        for(var i = 1; i < allKudos.length; i++)
        {
            var level = allKudos[i]; 
            var items = 1;

            for(var j = skip; (j < level.length && (items <= limit)); j++)
            {
                var currentKey = level[j];                
                allPromises.push(new Promise(function(resolve) {
                                                redisdb.hgetall(currentKey, function(err, jsonData) {
                                                    if(err) log.info('[/api/kudos/list] error retrieving hash value: ', err);
                                                    resolve(jsonData);            
                                                });
                                            }));    
                items++;            
            }            
        }

        Promise.all(allPromises)
               .then(kudosList => {
                    log.info('[/api/kudos/list] returning list of kudos size:', kudosList.length);
                    return res.status(200).json({ "kudos": kudosList });      
               })
               .catch(err => {
                    log.info('[/api/kudos/list] there was an error sending list of kudos error: ', err);            
                    console.log(err);
            });;
    });
};
