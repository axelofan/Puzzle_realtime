img = document.getElementById('img');
function checkPiece(id){
	if (!$('#'+id).hasClass('piece')) return;
    if ((Math.abs($('#'+id).data('x')*colsWidth-$('#'+id).offset().left-$('#game').scrollLeft())<=3) && (Math.abs($('#'+id).data('y')*rowsHeight-$('#'+id).offset().top-$('#game').scrollTop())<=3)){
		$('#'+id).draggable('disable').css({'top':$('#'+id).data('y')*rowsHeight, 'left':$('#'+id).data('x')*colsWidth,'z-index':1}).removeClass('piece').addClass('solved');
	}
}
img.onload=function() { 
    zIndex=3;
    rows=8, cols=8;
    rowsHeight = (img.height/rows);
    colsWidth = (img.width/cols);
    for(i=1; i<=rows; i++){
        for(j=1; j<=cols; j++){
			piece = document.createElement('canvas');
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
    img.height=500;
    rowsHeight = Math.round(img.height/rows);
    colsWidth = Math.round(img.width/cols);
    $('.piece').css('width',colsWidth);
	var host = location.origin.replace(/^http/, 'ws');
	//var host='ws://localhost:5000';
    var socket = new WebSocket(host);
	socket.onmessage=function(event) {
		JSON.parse(event.data).forEach(function(item) {
			$('#'+item.id).css({'left':item.left, 'top':item.top});
			checkPiece(item.id);
		});
	}
    $('.piece').draggable({drag: function() {
		socket.send(JSON.stringify({'id':this.id,'left':$(this).css('left'),'top':$(this).css('top')}));
	}});
    $('.piece').mousedown(function(){
        if (!$(this).hasClass('piece')) return;
		$(this).css('z-index',zIndex); 
        zIndex++;
    });
    $('.piece').mouseup(function(){checkPiece(this.id)});
}