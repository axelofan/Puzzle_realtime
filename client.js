//WebSocket Logic
var host = location.origin.replace(/^http/, 'ws');
var socket = new WebSocket(host);
socket.onmessage=function(event) {
	//Parse data on the start
	if (JSON.parse(event.data).img){
		$('.piece').off();
		$('#img').off();
		$('.solved').remove();
		rows=JSON.parse(event.data).rows;
		cols=JSON.parse(event.data).cols;
		var imgpath = JSON.parse(event.data).img;
		imgpath+= ($(document).height()<=720) ? '1280.jpg' : ($(document).height()<=1080) ? '1920.jpg' : '3840.jpg';
		$('#img').attr('src', imgpath);
		$('#img').on('load', function(){startGame(JSON.parse(event.data).pieces)});
	}
	//Parse on move other player
	if (JSON.parse(event.data).id) changePiece(JSON.parse(event.data).piece,JSON.parse(event.data).id);
	//Parse Player Message
	if(JSON.parse(event.data).message){
		var message=JSON.parse(event.data).message;
		if (messages.length==15) messages=messages.slice(1);
		messages.push(message);
		$('#messages').html('');
		for (var i=0; i<messages.length; i++) $('#messages').append(messages[i]+'<br>');
	}
}

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
				sendData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'),true);
				currentTime=Date.now();
			}
		},
		stop:function() {
			sendData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), false);
		}
	});
	
	$('.piece').on({'click': function(){
		if (!$(this).hasClass('piece')) return;
		$(this).data('angle',($(this).data('angle')+1)%4);
		$(this).css('transform','rotate('+($(this).data('angle')*90)+'deg)');
		sendData(this.id, 1/k*$(this).offset().left, 1/k*$(this).offset().top, $(this).data('angle'), $(this).data('x'), $(this).data('y'), true);
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
	$('#chatInput').val('');
	$('#chatInput').removeAttr('maxlength');
	$('#chatInput').attr('placeholder','Message');
	$('#okButton').attr('onclick','sendMessage()');
}
function sendMessage() {
	var message='<span class=nickname>'+nickname+':</span> '+$('#chatInput').val();
	$('#chatInput').val('');
	socket.send(JSON.stringify({'message':message}));
}

$('#chatInput').keyup(function(event) {
	if(event.keyCode==13) {
		if (nickname=='') changeNick();
		else sendMessage();
	}
});

//Created by JFMDev
//https://github.com/jfmdev/jqJigsawPuzzle
function randomPieceTypes(rows, cols) {
    var res = new Array();
    
    // Format used for represent a piece type as a binary number of four digits (dcba)
    // ----- d -----
    // c --------- a
    // ----- b -----
  
    // Define diagonal pieces.
    for(var i=0; i<rows; i++) {
        res[i] = new Array();
        for(var j=0; j<cols; j++) {
            if( (i+j)%2 == 0) {
                // Generate a random number between 0 and 15 (0000 and 1111).
                var rand = Math.floor(Math.random()*16); 
                // Verify if the piece is in a border.
                if(i == 0) { rand = rand | 8; }            // Is in the first row, set 'd' to 1.
                if(i == rows-1) { rand = rand | 2; }       // Is in the last row, set 'b' to 1.
                if(j == 0) { rand = rand | 4; }            // Is in the first column, set 'c' to 1.
                if(j == cols-1) { rand = rand | 1; }    // Is in the last column, set 'a' to 1.
                // Save value.
                res[i][j] = rand;
            }
        }
    }
	
    // Define the other pieces.
    for(i=0; i<rows; i++) {
		for(j=0; j<cols; j++) {
			if((i+j)%2 == 1) {
				var det = 0;
				if(i != 0) { det = det | (res[i-1][j] & 2)<<2; }           // d = !b from the piece up.
				if(i != rows-1) { det = det | (res[i+1][j] & 8)>>2; }      // b = !d from the piece down.
				if(j != 0) { det = det | (res[i][j-1] & 1)<<2; }           // c = !a from the piece left.
				if(j != cols-1) { det = det | (res[i][j+1] & 4)>>2; }   // a = !c from the piece right.
				res[i][j] = 15 - det;
            }
        }
	}
	
    // Convert binary number into strings.
    for(i=0; i<rows; i++) {
		for(j=0; j<cols; j++) {
			var value = '';
			value += ((res[i][j] & 8) != 0)? '1' : '0';
			value += ((res[i][j] & 4) != 0)? '1' : '0';
			value += ((res[i][j] & 2) != 0)? '1' : '0';
			value += ((res[i][j] & 1) != 0)? '1' : '0';
			res[i][j] = value;
        }
	}
	return res;
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
function sendData (id, left, top, angle, x, y, drag) {
	socket.send(JSON.stringify({'id':id,'left':left,'top':top,'angle':angle,'x':x,'y':y,'drag':drag}));
}
function hideChat() {
	if ($('#chat').css('height')=='400px') {
		$('#chat').css('height','25px');
		$('#messages').css('display','none');
		$('#hideButton').css('transform','rotate(180deg)');
	}
	else {
		$('#chat').css('height','400px');
		$('#messages').css('display','block');
		$('#hideButton').css('transform','rotate(0deg)');
	}
}
		