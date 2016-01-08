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