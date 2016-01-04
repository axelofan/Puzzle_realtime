//Game Logic
var rows=6, cols=10; //image size 1000x600px
var img;
var pieces;
var complete;
var messages=[];
function initGame() {
	img = '/images/'+Math.floor(Math.random()*12+1)+'.jpg';
	complete=0;
	pieces=[];
	for (i=1;i<=rows;i++){
		for (j=1;j<=cols;j++){
			pieces.push({'id':'piece'+i+'_'+j,
						'left':Math.floor(Math.random()*1000),
						'top':Math.floor(Math.random()*600),
						'angle':Math.floor(3*Math.random())
			});
		}
	}
}
initGame();

//HTTPServer
var app=require('express')();
var http=require('http');
var port=process.env.PORT || 80;
app.get('/', function(req,res){
	res.sendfile('index.html');
});
app.get(/^(.+)$/, function(req, res){ 
	res.sendfile( __dirname + req.params[0]);
});
var server = http.createServer(app)
server.listen(port)

//WSServer
var wss=require('ws').Server({server: server});
wss.on('connection',function(ws) {
	ws.send(JSON.stringify({'rows':rows,'cols':cols,'img':img,'pieces':pieces,'messages':messages}));
	ws.on('message', function(data) {
		//Broadcast players move
		if (JSON.parse(data).id){
			var a = JSON.parse(data);
			for (i=0;i<pieces.length;i++){
				if(pieces[i].id==a.id) {
					pieces[i].top=a.top;
					pieces[i].left=a.left;
					pieces[i].angle=a.angle;
				}
			}
			for (var id in wss.clients) {if (wss.clients[id]!=ws) wss.clients[id].send(data);}
		}
		//Check endgame and restart game
		if (JSON.parse(data).endgame){
			complete++;
			if (complete==wss.clients.length) {
				initGame();
				for (var id in wss.clients) {wss.clients[id].send(JSON.stringify({'newgame':true}));}
			}
		}
		//Chat message
		if (JSON.parse(data).message) {
			if (messages.length==15) messages=messages.slice(1);
			messages.push(JSON.parse(data).message);
			for (var id in wss.clients) {wss.clients[id].send(JSON.stringify({'messages':messages}));}
		}
	});
});