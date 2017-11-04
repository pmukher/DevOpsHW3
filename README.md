**Pratik Mukherjee** <br />
**Unity ID: pmukher** <br />
**Masters in Computer Science** <br />
**North Carolina State University** <br />

**ScreenCast Link:** https://www.youtube.com/watch?v=XdIyfeZMwFk 

The repository consits of the following :- <br/> 
* main.js:  The node.js file through which the set, get, recent, upload, meow, spawn, listservers, destroy requests and the proxy server are implemented. <br/> 
* package.json: The package.json file that contains the dependencies on external modules required for executing the script.  <br />
* img: The folder which contains the image "morning.jpg" that needs to be uploaded by the express server.  
* upload: The folder where the image "morning.jpg" is uploaded by the server. <br/> 
* node_modules: The external node modules that might be required for implementing the functionality.  <br/> 

A simple express server has been implemented using express. The server has been implemented at port *3000*. A redis client has also been created at port *6379*. A redis client will be capable for maintaining certain in-memory data structures such as lists, strings which will be used for implementing some of the requests. The following routes have been implemented:- 

1. **/set:** The /set route sets a key value pair. It creates a key called *"key1"* and sets it value to *"this message will self-destruct in 10 seconds"*. It also expires the key-value pair after *10 seconds*. After the request has been successfully processed, it sends back a response text *"HELLO WORLD"* to the browser client. 

2. **/get:** The /get route retrieves the value of the key that was set by the /set route and sends it back to the client browser for display.  

3. **/recent:** There is a list of visited urls or sites is being mainted by the *app.use()* function. It maintains a redis list called *"list1"* and pushes the url into this list. The /recent route handles the request to display the last four visited urls. It uses *"ltrim"* redis command to trim the *"list1"* such that it contains only the four recently pushed urls. Using *"lrange"* the entire list is send back to the client-browser to be displayed.

4. **/upload:** The  /upload route uploads the image (as mentioned in the request) to the folder *upload* on the client. The image file to be uploaded, the path to the image file is specified while making the request through the command prompt using the command *curl -F "image=@./img/morning.jpg" localhost:3000/upload*  
The route also maintains a list of images uploaded in a redis list called *"Images2"*.  

6. **/meow:** The /meow route uses the ltrim command to remove the last inserted image from the list *"Images2"* and write into the client-browser window.  

7. **/spawn:**: The /spawn route generated a random port number between *1025* and *65535*. It then uses the *app.listen()* method to start a server at that particular port. It pushes the list of urls of the servers that were initiated into a list called *"serverList7"*. It also pushes the corresponding port numbers into a list called *"serversPorts2"*. After the server has been initiated, a response message is sent for display on the client-browser window. The message states that the *"The server has started at the URL: "* and is followed by the URL of the browser. 

8. **/listservers:** The /listservers route is used to process a request to display the list of all active servers. It uses the redis command *"lrange"* to get a list of all servers that have been initiated and are active. The list of server urls are retrieved from the redis list *"serverList7"* which maintains the list of active server urls. This list of server urls is sent to the client-browser for display.  

9. **/destroy:** The /destroy route first retrieves the list of server urls into a list *"result"* from the redis list *"serversList7"* using the *lrange* redis command. From this list it picks up a random server url that is to be destroyed. Now using the *lrem* command the server url is removed from the redis list *"serverList7"*.


**Proxy Server and dispatch of requests:** It is also required to create a proxy server. Whenever a request is made to the server, the server should dispatch the request to one of the active servers.
To create the server a libraty was used: *node-http-proxy*. It is a http programmable proxying library. The following tutorial was referred to for the purpose: https://github.com/nodejitsu/node-http-proxy </br> 
To use this library two external node.js modules were required: *'http'* and *'http-proxy'*. The proxy server was created at port *5050*. The *listen()* method was invoked to keep the proxy server running. In the *createServer* method we resolved the logic to determine the target server to which the request was to be dispatched if a request is sent to the proxy server. To uniformly dispatch the request, the redis *"rpoplpush"* command was used. The command takes two lists as arguments, deletes the element at the tail of the first list and appends it to the ehad of the second list and also returns the element. Here, the redis list *"serverList7"* was used both as second and first argument. As a result on successive invocation of the *"rpoplpush"* command (which takes place everytime a request is sent to the proxy server), the elements of the list *"serverList7"* are rotated and returned in a successive order. The returned element is a url of the active server. Using the *proxy.web()* command we dispatch the request to the server of the url that was returned by the *"rpoplpush"* command.  
*Point to be noted:* Everytime the proxy server is requested, the servers that were spawned by sending a request to the initial express server (at port *3000*) was killed. So it is necessary to keep them running or restart them once they have stopped. This is being handled by the *app.listen()* function which restarts all the servers at the ports that were pushed in the list *"serversPorts"* by the /spawn route. 









