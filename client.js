//WebSocket Logic
var host = location.origin;
var socket = io.connect(host);
//Parse data on the start
socket.on('gameData',function(data) {
	$('.piece').off();
	$('#img').off();
	$('.solved').remove();
	$('.piece').remove();
	$('#img').removeAttr('height');
	rows=data.rows;
	cols=data.cols;
	var imgpath = data.img;
	imgpath+= ($(document).height()<=720) ? '1280.jpg' : ($(document).height()<=1080) ? '1920.jpg' : '3840.jpg';
	$('#img').attr('src', imgpath);
	$('#img').on('load', function(){startGame(data.pieces)});
});
//Parse move other player
socket.on('piecePosition',function(data) {
	changePiece(data.piece,data.id);
});
//Parse Player Message
socket.on('chatMessage',function(data) {
	if (messages.length==15) messages=messages.slice(1);
	messages.push(data.message);
	$('#messages').html('');
	for (var i in messages) $('#messages').append(messages[i]+'<br>');
});

//Game Logic
var img=document.getElementById('img');
var throttleTime=50, currentTime=Date.now();
var rows, cols;
var k;
var realSize=170, logicalSize=100; //size of masks
var serverHeight=720; //Size of server coordinates 1280x720px
var offset = (realSize - logicalSize)/2;
var nickname='', score=0;
var messages=[];
hideChat();

//Start game
function startGame(pieces){
    var zIndex=3;
	k=img.width/(cols*logicalSize);
	realSize=k*realSize;
	logicalSize=k*logicalSize;
	offset=k*offset;
	var pieceType=randomPieceTypes(rows,cols);
	//Generate puzzle
    for(var i=1; i<=rows; i++){
        for(var j=1; j<=cols; j++){
			var piece = document.createElement('canvas');
			piece.id = 'piece'+i+'_'+j;
			piece.className='piece';
			piece.width=realSize;
			piece.height=realSize;
			piece.style.zIndex=2;
			piecectx=piece.getContext('2d');
			var mask=document.getElementById(pieceType[i-1][j-1]);
			piecectx.drawImage(mask,0,0,realSize,realSize);
			piecectx.globalCompositeOperation='source-in';
			piecectx.drawImage(img, (j-1)*logicalSize-offset, (i-1)*logicalSize-offset, realSize, realSize, 0, 0, realSize, realSize);
			document.getElementById('game').appendChild(piece);
			$('#piece'+i+'_'+j).data({'x':j-1,'y':i-1});
        }
    }
	k=$('#background').height()/img.height;
	img.height=k*img.height;
	realSize=k*realSize;
	logicalSize=k*logicalSize;
	offset=k*offset;
	k=img.height/serverHeight;
	$('.piece').css('width',realSize);
	if (img.width>$('#game').width()) $('#game').css('width',img.width); //mobile fix
	if (img.width>$('#background').width()) $('#background').css('width',img.width); //mobile fix
	$('#gameborder').css({'top':(-1)*offset,'left':(-1)*offset,'width': 1.06*$('#img').width()+3*offset,'height':$('#img').height()+2*offset});
	//Accept coordinate from server
	for (var id in pieces) changePiece(pieces[id],id);
	
    $('.piece').draggable({
		containment: '#gameborder', scroll:false,
		drag: function() {
			if (Date.now()-currentTime>throttleTime) {
				sendPieceData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'),true);
				currentTime=Date.now();
			}
		},
		stop:function() {
			sendPieceData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), false);
		}
	});
	
	$('.piece').on({'click': function(){
		if (!$(this).hasClass('piece')) return;
		$(this).data('angle',($(this).data('angle')+1)%4);
		$(this).css('transform','rotate('+($(this).data('angle')*90)+'deg)');
		sendPieceData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), true);
		},
		'mousedown': function(e){
			if (!isPiece(this.id,e)) {
				passEventLower(this.id, e);
				return;
			}
			if (!$(this).hasClass('piece')) return;
			$(this).css('z-index',zIndex); 
			zIndex++;
		}
	});
}

function changeNick() {
	nickname=$('#chatInput').val();
	$('#chatInput').val('').removeAttr('maxlength').attr('placeholder','Message');
	$('#okButton').attr('onclick','sendMessage()');
}
function sendMessage() {
	var message='<span class=nickname>'+nickname+':</span> '+$('#chatInput').val();
	$('#chatInput').val('');
	socket.emit('chatMessage',{'message':message});
}
$('#chatInput').keyup(function(event) {
	if(event.keyCode==13) {
		if (nickname=='') changeNick();
		else sendMessage();
	}
});
function isPiece (id,e) {
	var x = e.pageX-$('#'+id).offset().left;
	var y = e.pageY-$('#'+id).offset().top;
	return ((x>offset)&&(x<realSize-offset)&&(y>offset)&&(y<realSize-offset)) ? true : false;
}
function passEventLower(id, e) {
	$('#'+id).hide();
    var $el = $(document.elementFromPoint(e.pageX, e.pageY));
	$('#'+id).trigger('mouseup');
    $el.trigger(e);
	$('#'+id).show();
}
function changePiece(piece,id) {
	if ($('#'+id).hasClass('ui-draggable-dragging')) return;
	$('#'+id).css({'left':k*piece.left, 
					'top':k*piece.top,
					'transform':'rotate('+(piece.angle*90)+'deg)'
					});
	$('#'+id).data('angle',piece.angle);
	if (piece.solved==true) {
		if ($('#'+id).hasClass('ui-draggable')) $('#'+id).draggable('disable');
		$('#'+id).css('z-index',1).removeClass('piece').addClass('solved');
	}
}
function sendPieceData (id, left, top, angle, x, y, drag) {
	socket.emit('piecePosition',{'id':id,'left':left,'top':top,'angle':angle,'x':x,'y':y,'drag':drag});
}
function hideChat() {
	if ($('#chat').css('height')=='400px') {
		$('#chat').css('height','25px');
		$('#messages').hide();
		$('#hideButton').css('transform','rotate(180deg)');
	}
	else {
		$('#chat').css('height','400px');
		$('#messages').show();
		$('#hideButton').css('transform','rotate(0deg)');
	}
}	