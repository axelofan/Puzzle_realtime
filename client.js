//WebSocket Logic
var host = location.origin.replace(/^http/, 'ws');
var socket = new WebSocket(host);
socket.onmessage=function(event) {
	//Parse data on the start
	if (JSON.parse(event.data).img){
		$('#game').css('visibility','hidden');
		$('.solved').remove();
		rows=JSON.parse(event.data).rows;
		cols=JSON.parse(event.data).cols;
		$('#img').attr('src', location.origin+JSON.parse(event.data).img);
		$('#img').load(function(){startGame(JSON.parse(event.data).pieces)});
	}
	//Parse on move other player
	if(JSON.parse(event.data).id){
		var item = JSON.parse(event.data);
		if (!$('#'+item.id).hasClass('active')) {
			$('#'+item.id).css({'left':item.left, 
								'top':item.top,
								'transform':'rotate('+(item.angle*90)+'deg)'
							});
			$('#'+item.id).data('angle',item.angle);
			checkPiece(item.id);
		}
	};
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
//IMPORTANT The image size must be equal cols*logicalSize x rows*logicalSize px
var realSize=170, logicalSize=100;
var offset = (realSize - logicalSize)/2;
var nickname='', score=0;
var messages=[];

//Start game
function startGame(pieces){
    var zIndex=3;
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
			piecectx.drawImage(mask,0,0);
			piecectx.globalCompositeOperation='source-in';
			piecectx.drawImage(img, (j-1)*logicalSize-offset, (i-1)*logicalSize-offset, realSize, realSize, 0, 0, realSize, realSize);
			document.getElementById('game').appendChild(piece);
			$('#piece'+i+'_'+j).data({'x':j-1,'y':i-1});
        }
    }
	//Accept coordinate from server
	for(var i=0; i<pieces.length; i++){
		$('#'+pieces[i].id).css({'top':pieces[i].top,
								'left':pieces[i].left,
								'transform':'rotate('+(pieces[i].angle*90)+'deg)'
							})
							.data('angle',pieces[i].angle);
		checkPiece(pieces[i].id,false);
	}
	$('#game').css('visibility','visible'); 
	
    $('.piece').draggable({
		drag: function() {
			if (Date.now()-currentTime>throttleTime) {
				socket.send(JSON.stringify({'id':this.id,
											'left':$(this).css('left'),
											'top':$(this).css('top'),
											'angle':$(this).data('angle')
										})
				);
				currentTime=Date.now();
			}
		},
		stop:function() {
			if ($(this).offset().top<0) $(this).css('top','0px');
			if ($(this).offset.left()<0) $(this).css('left','0px');
			socket.send(JSON.stringify({'id':this.id,
										'left':$(this).css('left'),
										'top':$(this).css('top'),
										'angle':$(this).data('angle')
									})
			);
		}
	});
	
	$('.piece').click(function(){
		if (!$(this).hasClass('piece')) return;
		$(this).data('angle',($(this).data('angle')+1)%4);
		$(this).css('transform','rotate('+($(this).data('angle')*90)+'deg)');
		socket.send(JSON.stringify({'id':this.id,
										'left':$(this).css('left'),
										'top':$(this).css('top'),
										'angle':$(this).data('angle')
									})
		);
    })
	
    $('.piece').mousedown(function(e){
		if (isPiece(this.id,e)) {
			passEventLower(this.id, e);
			return;
		}
        if (!$(this).hasClass('piece')) return;
		$(this).css('z-index',zIndex); 
        zIndex++;
		$(this).addClass('active');
    });
	
    $('.piece').mouseup(function(){checkPiece(this.id,true); $(this).removeClass('active');});
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

function checkPiece(id,isClicked){
	if (!$('#'+id).hasClass('piece')) return;
    if ((Math.abs($('#'+id).data('x')*logicalSize-$('#'+id).offset().left-$('#game').scrollLeft()-offset)<=3) 
	&& (Math.abs($('#'+id).data('y')*logicalSize-$('#'+id).offset().top-$('#game').scrollTop()-offset)<=3)
	&& ($('#'+id).data('angle')==0)){
		if ($('#'+id).hasClass('ui-draggable')) $('#'+id).draggable('disable');
				$('#'+id).css({'top':$('#'+id).data('y')*logicalSize-offset, 
					'left':$('#'+id).data('x')*logicalSize-offset,
					'transform':'rotate(0deg)',
					'z-index':1
				})
				.removeClass('piece')
				.addClass('solved');
		if (isClicked) score++;
		if ($('.solved').length==rows*cols) socket.send(JSON.stringify({'endgame':true}));
	}
}

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
	return ((x>offset)&&(x<realSize-offset)&&(y>offset)&&(y<realSize-offset)) ? false : true;
}
function passEventLower(id, e) {
	$('#'+id).hide();
    var $el = $(document.elementFromPoint(e.pageX, e.pageY));
	$('#'+id).trigger('mouseup');
    $el.trigger(e);
	$('#'+id).show();
}