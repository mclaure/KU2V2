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
    var newKey = 'kudos:' + id + ':' + idDestinatario;
    
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

exports.del_all_kudos = (req, res, next) => {               
    const idUser = parseInt(req.params.userId, 10) || 0;  
    var patternKey = 'kudos:*:' + idUser;        
    
    redisdb.scan('0', 'MATCH', patternKey, 'COUNT', '1000', function(err, kudos){
        if(err) throw err;

        var kudosKey = kudos[1]; //always the second element

        if(kudosKey.length > 0)
        {
            for(var j = 0; j < kudosKey.length; j++)
            {
                redisdb.del(kudosKey[j]);             
            }

            log.info('[/api/kudos/del/all/:userIdl] all kudos from ', idUser, ' were deleted'); 
            res.status(200).json( { kudosDeleted: true });
        }
        else
        {
            log.info('[/api/kudos/del/all/:userIdl] all kudos from ', idUser, ' were not found');  
            res.status(300).json( { kudosNotFound: true });          
        }
    });
};

exports.del_kudos = (req, res, next) => {               
    const idKudos = parseInt(req.params.id, 10) || 0;          
    var patternKey = 'kudos:' + idKudos + ':*';

    redisdb.scan('0', 'MATCH', patternKey, 'COUNT', '1000', function(err, kudos){
        if(err) throw err;

         var kudosKey = kudos[1]; //always the second element

         if(kudosKey.length > 0)
         {          
            if (redisdb.exists(kudosKey[0],  function(err, reply) {
                if(err) log.info('[/api/kudos/del] error: ', err);   
                
                if (reply == 1) 
                {
                    redisdb.del(kudosKey[0]); 
                    log.info('[/api/kudos/del] kudos ', kudosKey, ' was deleted');   

                    var idDestinatario = kudosKey[0].split(':')[2];
                    var secKey = 'idDestinatario:' + idDestinatario + ':totalKudos';

                    if (redisdb.exists(secKey,  function(err, reply) {
                        if(err) log.info('[/api/kudos/del] error: ', err);   
                        
                        if (reply == 1) 
                        {
                            redisdb.decr(secKey);
                            log.info('[/api/kudos/del] key ', secKey, ' was decrement by 1'); 

                            redisdb.get(secKey, function(err, reply) { 
                                var total = parseInt(reply);
                                var message = JSON.stringify({ operation: "del", idDestinatario: idDestinatario, "newTotalKudos": total });

                                rmq.sendMessage(message);
                                res.status(200).json( { kudosDeleted: true });
                            });   
                        }
                        else
                        {
                            log.info('[/api/kudos/del] idDestinatario ', secKey, ' was Not Found');  
                            res.status(303).json( { kudosDeleted: false });                        
                        }
                    }));                               
                }
                else
                {
                    log.info('[/api/kudos/del] idDestinatario ', kudosKey, ' was Not Found'); 
                    res.status(303).json( { kudosDeleted: false });                          
                }
            })); 
        }
        else
        {
            log.info('[/api/kudos/del] kudos was Not Found');  
            res.status(303).json( { kudosNotFound: true });     
        }           
    });
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
