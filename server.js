//Game Logic
var rows=9, cols=16; //image ratio
var imgHost='/images/';
var imgCount=10
var gameData;
var img;
var pieces;
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
	res.sendFile(__dirname+'/index.html');
});
app.get(/^(.+)$/, function(req, res){ 
	res.sendFile( __dirname + req.params[0]);
});
var server = http.createServer(app)
server.listen(port)

//WSServer
var wss=require('socket.io').listen(server);
wss.on('connection',function(ws) {
	ws.emit('gameData', gameData);
	//broadcast player move
	ws.on('piecePosition',function(data) {
		var solved=false;
		var solveCount=0;
		//Check piece solved
		if ((!data.drag)&&(Math.abs(data.x*logicalSize-data.left-offset)<=5)&&(Math.abs(data.y*logicalSize-data.top-offset)<=5)&&(data.angle==0)&&(!pieces[data.id].solved)){
			data.left=data.x*logicalSize-offset;
			data.top=data.y*logicalSize-offset;
			solved=true;
		}
		pieces[data.id]={'top':data.top,'left':data.left,'angle':data.angle,'solved':solved};
		ws.broadcast.emit('piecePosition',{'id':data.id,'piece':pieces[data.id]});
		if (!data.drag) ws.emit('piecePosition',{'id':data.id,'piece':pieces[data.id]});
		for (var id in pieces) if (pieces[id].solved) solveCount++;  
		if (solveCount==rows*cols) {
			initGame();
			wss.sockets.emit('gameData', gameData);
		}
	});
	//Chat message
	ws.on('chatMessage',function(data) {
		wss.sockets.emit('chatMessage', data);
	});
});