﻿//WebSocket Logic
var host = location.origin.replace(/^http/, 'ws');
//var host='ws://localhost';
var socket = new WebSocket(host);
socket.onmessage=function(event) {
	//Parse data on the start
	if (JSON.parse(event.data).img){
		rows=JSON.parse(event.data).rows;
		cols=JSON.parse(event.data).cols;
		$('#img').attr('src', location.origin+JSON.parse(event.data).img);
		//$('#img').attr('src', 'http://localhost'+JSON.parse(event.data).img);
		$('#img').load(function(){startGame(JSON.parse(event.data).pieces)});
	}
	//Parse on move other player
	if(JSON.parse(event.data).id){
		var item = JSON.parse(event.data);
		$('#'+item.id).css({'left':item.left, 'top':item.top});
		checkPiece(item.id);
	};
	//Parse new game
	if(JSON.parse(event.data).newgame){
		location.reload();
	}
}

//Game Logic
var img=document.getElementById('img');
var throttleTime=50, currentTime=Date.now();
var rows, cols;
var rowsHeight, colsWidth;

//Start game
function startGame(pieces){
    var zIndex=3;
    rowsHeight = Math.round(img.height/rows);
    colsWidth = Math.round(img.width/cols);
	//Generate puzzle
    for(var i=1; i<=rows; i++){
        for(var j=1; j<=cols; j++){
			var piece = document.createElement('canvas');
			piece.id = 'piece'+i+'_'+j;
			piece.className='piece';
			piece.width=colsWidth;
			piece.height=rowsHeight;
			piece.style.zIndex=2;
			piecectx=piece.getContext('2d');
			piecectx.drawImage(img, (j-1)*colsWidth, (i-1)*rowsHeight, colsWidth, rowsHeight, 0, 0, colsWidth, rowsHeight);
			document.getElementById('game').appendChild(piece);
			$('#piece'+i+'_'+j).data({'x':j-1,'y':i-1});
        }
    }
	//Change puzzle size
	img.height=600;
	rowsHeight = Math.round(img.height/rows);
    colsWidth = Math.round(img.width/cols);
	$('.piece').css('width',colsWidth);
	//Accept coordinate from server
	for(var i=0; i<pieces.length; i++){
		$('#'+pieces[i].id).css({'top':pieces[i].top,'left':pieces[i].left});
		checkPiece(pieces[i].id);
	}
	
    $('.piece').draggable({
		drag: function() {
			if (Date.now()-currentTime>throttleTime) {
				socket.send(JSON.stringify({'id':this.id,'left':$(this).css('left'),'top':$(this).css('top')}));
				currentTime=Date.now();
			}
		},
		stop:function() {
			socket.send(JSON.stringify({'id':this.id,'left':$(this).css('left'),'top':$(this).css('top')}));
		}
	});
	
    $('.piece').mousedown(function(){
        if (!$(this).hasClass('piece')) return;
		$(this).css('z-index',zIndex); 
        zIndex++;
    });
	
    $('.piece').mouseup(function(){checkPiece(this.id)});
}

function checkPiece(id){
	if (!$('#'+id).hasClass('piece')) return;
    if ((Math.abs($('#'+id).data('x')*colsWidth-$('#'+id).offset().left-$('#game').scrollLeft())<=3) 
	&& (Math.abs($('#'+id).data('y')*rowsHeight-$('#'+id).offset().top-$('#game').scrollTop())<=3)){
		$('#'+id).draggable('disable')
		.css({'top':$('#'+id).data('y')*rowsHeight, 'left':$('#'+id).data('x')*colsWidth,'z-index':1})
		.removeClass('piece')
		.addClass('solved');
		socket.send(JSON.stringify({'solve':true}));
	}
}