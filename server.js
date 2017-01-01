//HTTPServer
const express=require('express');
const app = express();
const http=require('http');
const port=process.env.PORT || 80;
app.use(express.static('public'));
const server = http.createServer(app);
server.listen(port);

//Game Constants
const rows=9, cols=16; //image ratio
const pieces={};
const gameData={'rows':rows,'cols':cols};
const realSize=136, logicalSize=80, offset=28 //piece size for 1280x720px

//Init Game Data
function initGame() {
	for (i=1;i<=rows;i++){
		for (j=1;j<=cols;j++){
			pieces['piece'+i+'_'+j]={'left':Math.floor(Math.random()*1160),
									'top':Math.floor(Math.random()*600),
									'angle':Math.floor(3*Math.random()),
									'solved':false
			};
		}
	}
	gameData['pieces']=pieces;
}
initGame();



//WSServer
var wss=require('socket.io').listen(server);
wss.on('connection',function(ws) {
	ws.emit('gameData', gameData);
	//broadcast player move
	ws.on('piecePosition',function(data) {
		let solveCount=0;
		let solved=false;

		//Check piece solved
		if ((!data.drag)&&inLeftSide(data)&&inTopSide(data)&&(data.angle==0)&&(!pieces[data.id].solved)){
			data.left=data.x*logicalSize-offset;
			data.top=data.y*logicalSize-offset;
			solved = true;
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
	ws.on('newImage',function(data) {
		ws.emit('gameData', gameData);
	});
});

function inLeftSide(data) {
	return Math.abs(data.x*logicalSize-data.left-offset)<=5;
}

function inTopSide(data) {
	return Math.abs(data.y*logicalSize-data.top-offset)<=5;
}