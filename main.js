var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs'); 
var httpProxy = require('http-proxy'); 
var http = require('http'); 
var proxy = httpProxy.createProxyServer(); 
console.log("Proxy server is: ")
console.log(proxy)
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
///////////// WEB ROUTES
// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);
	client.lpush("list1", req.url); 
	next(); // Passing the request to the next handler in the stack.
});

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files
   if( req.files.image )
   {
	   console.log("Image process request received")
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		client.lpush("Images2", img, function(err, num){
	  			console.log("The number of images in the list after push: "+num)
	  		}); 
	  		console.log(img);
		});
	   
	}
	else{
		console.log("Request was not processed")
	}
   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
		
		//if (err) throw err
		res.writeHead(200, {'content-type':'text/html'});
		var lengthBeforeTrimming
		client.lrange("Images2", 0, -1, function(err, items){
			lengthBeforeTrimming = items.length
			console.log("The length of the list Images before trimming: "+lengthBeforeTrimming); 
		})
		client.lrange("Images2", 0, 0, function(err, items){
		 items.forEach(function (imagedata) 
		 {
    		res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
		 });
		 res.end();
	});
   	client.ltrim("Images2", 1, -1) 
   	client.lrange("Images2", 0, -1, function(err, itemsTrimmed){
   		var lenAfterTrimming = itemsTrimmed.length
   		console.log("The length of the list Images after trimming: ", lenAfterTrimming)
   	});
})

app.get('/set', function(req, res) {
  client.set("key1", "this message will self-destruct in 10 seconds"); 
  client.expire("key1", 10); 
  res.send("HELLO WORLD"); 
})

app.get('/get', function(req, res) {
	client.get("key1", function(err, result){
		res.send(result); 
	}); 
})

app.get('/', function(req, res) {
	res.send("The server is running"); 
})

app.get('/recent', function(req, res) {
	client.ltrim("list1", 0, 4, function(err, result){
		client.lrange("list1", 0, -1, function(err1, result1){
			res.send(result1); 
		});
	}); 
})

//Creates a redis server and pushes the server URLs to a redis list 
 app.get('/spawn', function(req, res) {
 	var min = Math.ceil(1025);
 	var max = Math.floor(65535);
 	var url; 
 	var portNumber = Math.floor(Math.random()*(max - min)) + min; 
   	var server = app.listen(portNumber, "127.0.0.1", function (err, result) {
   	if (!err){
   		var host = server.address().address
   		var port = server.address().port
   		url = "http://"+host+":"+port 
   		console.log('Example app listening at http://%s:%s', host, port)
   		var message = "The server has started at the URL: "+url
   		res.send(message); 
	}
	else{
			console.log('Error occured while creatin the server');
			console.log(err);
	}
	client.lpush("serversPorts2", portNumber);
	client.lpush("serverList7", url); 
 })
})

 //Lists the server URls that were created 
 app.get('/listservers', function(req, res){
 	client.lrange("serverList7", 0, -1, function(err, result){
 		var message = "The servers are running at the urls: "
 		for(var i=0; i<result.length; i++){
 			var portNumber = result[i]
 			if(i != result.length -1)
 				message+=portNumber+", "
 			else 
 				message+=portNumber 
 		}
 		res.send(message); 
 	})
})

 //Destroy functionality: Picks a random server URL from the redis list and removes it from the list and thereby destroys the server  
 app.get('/destroy', function(req, res){
 	var deleteServer
 	client.lrange("serverList7", 0, -1, function(err, result){
 		var len = result.length; 
 		console.log("The number of active servers: "+len)
 		console.log("The active servers:")
 		for(var i=0; i<len; i++){
 			console.log(result[i]); 
 		}
 		deleteServer = result[Math.floor(Math.random()*len)]
 		var message = "The server to be deleted is : "+deleteServer
 		console.log(message)
 		client.lrem("serverList7", 1, deleteServer, function(err1, result1){
 			if(!err1){
 				console.log("The server ", deleteServer," destroyed!")
 				var msg = "The server "+deleteServer+" destroyed!"
 				res.send(msg)
 		}
 	}) 
 	})
 })

 var server = app.listen(3000, "127.0.0.1", function () {
   var host = server.address().address
   var port = server.address().port
   console.log('Example app listening at http://%s:%s', host, port)
 })

client.lrange("serversPorts2", 0, -1, function(err, res){
	for(var i=0; i<res.length;i++){
		app.listen(res[i], "127.0.0.1")
	}
})

console.log("Listening on port 5050")

var proxyServer = http.createServer(function(req, res){
	var result = client.rpoplpush("serverList7", "serverList7", function(err, reqServer){
		console.log("The server where the request is to be routed is: "+reqServer)
		proxy.web(req, res, { 
		target: reqServer
		}); 
	})
})

var proxyCreated = proxyServer.listen(5050, "127.0.0.1", function(err, result){
	if(!err){
		var host = proxyCreated.address().address
		var port = proxyCreated.address().port
		console.log("The proxy server has started successfully at http://%s:%s", host, port)
	}
}); 





