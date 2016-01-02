//Game Logic
var rows=10, cols=10;
var img;
var pieces;
var complete;
var players={};
function initGame() {
	img = '/images/'+Math.floor(Math.random()*5+1)+'.jpg';
	complete=0;
	pieces=[];
	for (i=1;i<=cols;i++){
		for (j=1;j<=rows;j++){
			pieces.push({'id':'piece'+i+'_'+j,
						'left':Math.floor(Math.random()*400),
						'top':Math.floor(Math.random()*400),
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
	ws.send(JSON.stringify({'rows':rows,'cols':cols,'img':img,'pieces':pieces}));
	ws.send(JSON.stringify({'players':players}));
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
			wss.clients.forEach(function(item) {if (item!=ws) item.send(data);});
		}
		//Check endgame and restart game
		if (JSON.parse(data).endgame){
			complete++;
			if (complete==wss.clients.length) {
				initGame();
				wss.clients.forEach(function(item) {item.send(JSON.stringify({'newgame':true}));});
			}
		}
		//PlayerStats
		if (JSON.parse(data).nickname) {
			if (typeof(players[JSON.parse(data).nickname])!='undefined') players[JSON.parse(data).nickname]+=1;
			else players[JSON.parse(data).nickname]=0;
			wss.clients.forEach(function(item) {item.send(JSON.stringify({'players':players}));});
		}
	});
});