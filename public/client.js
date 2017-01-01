//Game Constants
var img=document.getElementById('img');
var throttleTime=50, currentTime=Date.now();
var rows, cols;
var k;
var realSize=170, logicalSize=100, offset = 35; //size of masks
var serverHeight=720; //Size of server coordinates 1280x720px

function getRandomImage() {
	var path = '/Images';
	path+= ($(document).height()<=720) ? '/1280/' : ($(document).height()<=1080) ? '/1920/' : '/3840/';
	path+=Math.ceil(5*Math.random())+'.jpg';
	return path;
}

//WebSocket Logic
var host = location.origin;
var socket = io.connect(host);

//Parse data on the start
socket.on('gameData',function(data) {
	$('.piece').off().remove();
	$('#img').off().removeAttr('height');
	$('.solved').remove();
	rows=data.rows;
	cols=data.cols;	
	$('#img').attr('src', getRandomImage()).on('load', function(){startGame(data.pieces)});
});

//Parse move other player
socket.on('piecePosition',function(data) {
	changePiece(data.piece,data.id);
});

//Send piece position to server
function sendPieceData (id, left, top, angle, x, y, drag) {
	socket.emit('piecePosition',{'id':id,'left':left,'top':top,'angle':angle,'x':x,'y':y,'drag':drag});
}

//Change puzzle background
function newImage() {
	socket.emit('newImage');
}

//Start game
function startGame(pieces){
    var zIndex=3;

	//Change piece size for real image
	k=img.width/(cols*logicalSize);
	realSize=k*realSize;
	logicalSize=k*logicalSize;
	offset=k*offset;

	//Generate puzzle
	var pieceType=randomPieceTypes(rows,cols);
    for(var i=1; i<=rows; i++){
        for(var j=1; j<=cols; j++){
			var piece = document.createElement('canvas');
			piece.id = 'piece'+i+'_'+j;
			piece.width=piece.height=realSize;
			piecectx=piece.getContext('2d');
			var mask=document.getElementById(pieceType[i-1][j-1]);
			piecectx.drawImage(mask,0,0,realSize,realSize);
			piecectx.globalCompositeOperation='source-in';
			piecectx.drawImage(img, (j-1)*logicalSize-offset, (i-1)*logicalSize-offset, realSize, realSize, 0, 0, realSize, realSize);
			document.getElementById('game').appendChild(piece);
			$('#piece'+i+'_'+j).addClass('piece').css('z-index',2).data({'x':j-1,'y':i-1});
        }
    }

	//change image and piece size for full height
	k=$(document).height()/img.height;
	img.height=k*img.height;
	realSize=k*realSize;
	logicalSize=k*logicalSize;
	offset=k*offset;
	$('.piece').css('width',realSize);

	//k helps to translate server coordinates to the screen
	k=serverHeight/img.height;

	//mobile fix
	if (img.width>$('#game').width()) $('#game').css('width',img.width);

	//set size to drag border
	$('#gameborder').css({'top':(-1)*offset,'left':(-1)*offset,'width': 1.06*$('#img').width()+3*offset,'height':$('#img').height()+2*offset});

	//Accept coordinate from server
	for (var id in pieces) changePiece(pieces[id],id);
	
    $('.piece').draggable({
		containment: '#gameborder', scroll:false,
		drag: function() {
			if (Date.now()-currentTime>throttleTime) {
				sendPieceData(this.id, k*$(this).offset().left, k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'),true);
				currentTime=Date.now();
			}
		},
		stop:function() {
			sendPieceData(this.id, k*$(this).offset().left, k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), false);	
		}
	});
	
	$('.piece').on({'click': function(){
		if (!$(this).hasClass('piece')) return;
		$(this).data('angle',($(this).data('angle')+1)%4);
		$(this).css('transform','rotate('+($(this).data('angle')*90)+'deg)');
		sendPieceData(this.id, k*$(this).offset().left, k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), true);
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
	$('#'+id).css({'left':1/k*piece.left, 
					'top':1/k*piece.top,
					'transform':'rotate('+(piece.angle*90)+'deg)'
					});
	$('#'+id).data('angle',piece.angle);
	if (piece.solved==true) {
		if ($('#'+id).hasClass('ui-draggable')) $('#'+id).draggable('disable');
		$('#'+id).css('z-index',1).removeClass('piece').addClass('solved');
	}
}

function changeBackground() {
	var color = (document.body.style.background == 'rgb(68, 68, 68)') ? '#e2e2e2' : '#444';
	document.body.style.background = color;
}