require('fs').readFile('./index.html',function(data,err){
	require('http').createServer(function(req,res){
		res.writeHead(200,{'Content-Type':'text/html'});
		res.write(data);
		res.end();
	}).listen(8080);
});

var piece=[];
for (i=1;i<=8;i++){
	for (j=1;j<=8;j++){
		piece.push({'id':'piece'+i+'_'+j,'left':Math.floor(Math.random()*400),'top':Math.floor(Math.random()*400)});
	}
}
var wss=require('ws').Server({port:9000});
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
		//piece.forEach(function(item) {if(item.id==a.id){item.top=Math.floor(a.top);item.left=Math.floor(a.left);}});
		data='['+data+']';
		wss.clients.forEach(function(item) {if (item!=ws) item.send(data);});
	});
});