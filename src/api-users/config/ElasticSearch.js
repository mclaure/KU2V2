
'use strict';

var elasticsearch = require('elasticsearch');
const logger = require('../logger/logger');
var elasticClient = new elasticsearch.Client({
  	host: 'localhost:9200',
  	log: 'info'
});

module.exports = {

    Initialize: function(indexName) {
        elasticClient.indices.exists({
            index: indexName
        }).then(function (resp) {
            logger.info('[ElasticSearch] Initialize indexExists: ' + resp);
            if(resp == false)
            {
                elasticClient.indices.create({
                    index: indexName
                }).then(function (resp) {
                    logger.info('[ElasticSearch] index: ' + indexName + ' was created. ' + JSON.stringify(resp));
                }, function (err) {
                    logger.info('[ElasticSearch] error creating index: ' + indexName + ' error: ' + err.message);
                });
            }
        }, function (err) {
            logger.info('[ElasticSearch] indexExists error: ' + err.message);
        });
    },

	ping: function() {
		elasticClient.ping({
		  	requestTimeout: 30000,
		}, function (error) {
			if (error) {
                logger.info('[ElasticSearch] cluster is down!');
			} else {
                logger.info('[ElasticSearch] cluster is up!');              
			}
		});
	},

	initIndex: function(indexName){
	    elasticClient.indices.create({
	        index: indexName
	    }).then(function (resp) {
            logger.info('[ElasticSearch] index: ' + indexName + ' was created. ' + JSON.stringify(resp));
	    }, function (err) {
            logger.info('[ElasticSearch] error creating index: ' + indexName + ' error: ' + err.message);
	    });
	},
	
	indexExists: function(indexName){
        return new Promise(function(resolve, reject) {
            elasticClient.indices.exists({
                index: indexName
            }).then(function (resp) {
                logger.info('[ElasticSearch] indexExists: ' + JSON.stringify(resp));
                resolve(resp);
            }, function (err) {
                logger.info('[ElasticSearch] indexExists error: ' + err.message);
                reject(err);
            });
        });
	},

	initMapping: function(indexName, docType, payload){
	    elasticClient.indices.putMapping({
	        index: indexName,
	        type: docType,
	        body: payload
	    }).then(function (resp) {   
            logger.info('[ElasticSearch] initMapping: ' + JSON.stringify(resp));     
	    }, function (err) {
            logger.info('[ElasticSearch] initMapping error: ' + err.message);
	    });
	},

	addDocument: function(indexName, _id, docType, payload){
	    elasticClient.index({
	        index: indexName,
	        type: docType,
	        id: _id,
	        body: payload
	    }).then(function (resp) {
            logger.info('[ElasticSearch] addDocument: ' + JSON.stringify(resp));    
	    }, function (err) {
            logger.info('[ElasticSearch] addDocument error: ' + err.message);
	    });
	},

	updateDocument: function(index, _id, docType, payload){
		elasticClient.update({
		  index: index,
		  type: docType,
		  id: _id,
		  body: payload
		}, function (err, resp) {
		  	if(err) logger.info('[ElasticSearch] updateDocument error: ' + err.message);  
		  	logger.info('[ElasticSearch] updateDocument: ' + JSON.stringify(resp)); 
		})
	},

	search: function(indexName, docType, payload){
		elasticClient.search({
	        index: indexName,
	        type: docType,
	        body: payload
	    }).then(function (resp) {
            logger.info('[ElasticSearch] search: ' + JSON.stringify(resp)); 
	    }, function (err) {
            logger.info('[ElasticSearch] search error: ' + err.message);  
	    });
	},

	deleteDocument: function(index, _id, docType){
		elasticClient.delete({
		    index: index,
			type: docType,
			id: _id,
		}, function(err, resp) {
            if(err) logger.info('[ElasticSearch] deleteDocument error: ' + err.message);  
            logger.info('[ElasticSearch] deleteDocument: ' + JSON.stringify(resp)); 
		});
	},

	deleteAll: function(){
		elasticClient.indices.delete({
		    index: '_all'
		}, function(err, resp) {

		    if (err) {
		        logger.info('[ElasticSearch] deleteAll error: ' + err.message); 
		    } else {
                logger.info('[ElasticSearch] deleteDocument: ' + JSON.stringify(resp)); 
		    }
		});
	}
};