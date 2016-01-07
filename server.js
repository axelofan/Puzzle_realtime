//Game Logic
var rows=9, cols=16; //image ratio
var imgHost='/images/';
var imgCount=10
var gameData;
var img;
var pieces;
var solveCount;
var realSize=136, logicalSize=80, offset=28 //piece size for 1280x720px

function initGame() {
	img = imgHost+Math.ceil(Math.random()*imgCount)+'/';
	pieces={};
	solveCount=0;
	for (i=1;i<=rows;i++){
		for (j=1;j<=cols;j++){
			pieces['piece'+i+'_'+j]={'left':Math.floor(Math.random()*1160),
									'top':Math.floor(Math.random()*600),
									'angle':Math.floor(3*Math.random()),
									'solved':false
			};
		}
	}
	gameData={'rows':rows,'cols':cols,'img':img,'pieces':pieces};
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
	ws.send(JSON.stringify(gameData));
	ws.on('message', function(data) {
		//Broadcast players move
		if (JSON.parse(data).id){
			var solved=false;
			var a = JSON.parse(data);
			//Check piece solved
			if ((!a.drag)&&(Math.abs(a.x*logicalSize-a.left-offset)<=5)&&(Math.abs(a.y*logicalSize-a.top-offset)<=5)&&(a.angle==0)){
				a.left=a.x*logicalSize-offset;
				a.top=a.y*logicalSize-offset;
				solved=true;
				solveCount++;
			}
			pieces[a.id]={'top':a.top,'left':a.left,'angle':a.angle,'solved':solved};
			for (var id in wss.clients) wss.clients[id].send(JSON.stringify({'id':a.id,'piece':pieces[a.id]}));
			if (solveCount==rows*cols) {
				initGame();
				for (var id in wss.clients) wss.clients[id].send(JSON.stringify(gameData));
			}
		}
		//Chat message
		if (JSON.parse(data).message) {
			for (var id in wss.clients) {wss.clients[id].send(data);}
		}
	});
});