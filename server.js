var app=require('express')();
var http=require('http');
var port=process.env.PORT || 5000;
app.get('/', function(req,res){
	res.sendfile('index.html');
});
app.get(/^(.+)$/, function(req, res){ 
    res.sendfile( __dirname + req.params[0]); 
 });
var server = http.createServer(app)
server.listen(port)

var piece=[];
for (i=1;i<=8;i++){
	for (j=1;j<=8;j++){
		piece.push({'id':'piece'+i+'_'+j,'left':Math.floor(Math.random()*400),'top':Math.floor(Math.random()*400)});
	}
}
var wss=require('ws').Server({server: server});
wss.on('connection',function(ws) {
	ws.send(JSON.stringify(piece));
	ws.on('message', function(data) {
		var a = JSON.parse(data);
		for (i=0;i<piece.length;i++){
			if(piece[i].id==a.id) {
				piece[i].top=a.top;
				piece[i].left=a.left;
			}
		}
		wss.clients.forEach(function(item) {if (item!=ws) item.send('['+data+']');});
	});
});