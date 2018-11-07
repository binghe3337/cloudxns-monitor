#!/usr/bin/env node
var crypto = require('crypto');
var request = require("request");
var exec = require('child_process').exec; 

ipList = '1.0.0.1,1.0.0.85';
var host = 'example.com';
var checkPort = '443';
var checkFile = 'https://example.com/ipcheck.txt';
var apiKey = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX';
var secretKey = 'XXXXXXXXXXXXXXX';
domainId = 'XXXXXX';
recordId = 'XXXXXXX';
hostRecord = '@';
ttl = 60;
recordType = 'A';
lineId = 1;
defaultIp = '1.0.0.86';

var presentIp = '';
var checkIp = (function (host, checkPort, checkFile) {
    var cmdStr = 'curl -m 5 ' + checkFile + ' --resolve ' + host + ':' + checkPort + ':';
    var resultArr = [];
    var i=0;
    return function (ipAddrArr) {
        exec(cmdStr + ipAddrArr[i], function(err,stdout,stderr){
            console.log(ipAddrArr[i]);
            if (stdout.indexOf('ok')!=-1) {
                resultArr.push(ipAddrArr[i]);
            }
            if (i<ipAddrArr.length-1 && stdout.indexOf('ok')==-1) {
                i++;
                checkIp(ipAddrArr);
            } else {
                resultArr.push(defaultIp);
                console.log(resultArr);
                if (resultArr[0] != presentIp) {
                	var apiRequestDate2 = new Date().toUTCString();
                	var URL2 = 'https://www.cloudxns.net/api2/record/' + recordId;
                	var jsonForm2 = {
                	    "domain_id": domainId,
                	    "host": hostRecord,
                	    "value": resultArr[0],
                	    "ttl": ttl,
                	    "type": recordType,
                	    "line_id": lineId
                	};
                	var md52 = crypto.createHash('md5');
                	var result2 = md52.update(apiKey+URL2+JSON.stringify(jsonForm2)+apiRequestDate2+secretKey).digest('hex');
                	request({
                	    url: URL2,
                	    method: "PUT",
                	    json: true,
                	    headers: {
                	        'API-KEY': apiKey,
                	        'API-REQUEST-DATE': apiRequestDate2,
                	        'API-HMAC': result2
                	    },
                	    body: jsonForm2
                	}, function(error, response, body) {
                		if (!error && response.statusCode == 200) {
                			if (body.code == 1) {
                				presentIp = body.data.value;
                				console.log('New IP is: ' + presentIp);
                				resultArr = [];
                				i = 0;
                				setTimeout(function () {
                					checkIp(ipAddrArr);
                				}, 60000);
                			} else {
                	    	    resultArr = [];
                		    i = 0;
                		    setTimeout(function () {
                		        checkIp(ipAddrArr);
                		    }, 60000);
                			}
                		} else {
                	    	    resultArr = [];
                		    i = 0;
                		    setTimeout(function () {
                		        checkIp(ipAddrArr);
                		    }, 60000);
                		}
                	});
                } else {
                	resultArr = [];
                	i = 0;
                	setTimeout(function () {
                		checkIp(ipAddrArr);
                	}, 60000);
                }
            }
        });
    };
})(host, checkPort, checkFile);


var apiRequestDate1 = new Date().toUTCString();
var URL1 = 'https://www.cloudxns.net/api2/record/detail/' + domainId + '?recordids=' + recordId;
var jsonForm1 = '';
var md51 = crypto.createHash('md5');
var result1 = md51.update(apiKey+URL1+apiRequestDate1+secretKey).digest('hex');
request({
    url: URL1,
    method: "GET",
    json: true,
    headers: {
        'API-KEY': apiKey,
        'API-REQUEST-DATE': apiRequestDate1,
        'API-HMAC': result1
    }
}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        if (body.code == 1) {
           presentIp = body.list[0].value;
           console.log('Present IP is ' + presentIp);
           var ipAddrArr = ipList.split(',');
           checkIp(ipAddrArr);
        } else {
            console.log('API ERROR');
        }
    } else {
        console.log('API ERROR');
    }
});

