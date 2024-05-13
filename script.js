var
    canvas = document.getElementById( 'canvas' ),
    secret = document.getElementById( 'secret' ),
    coverAfter = document.getElementById( 'coverAfter' ),
    ctx = canvas.getContext( '2d' ),
    ctxSecret = secret.getContext( '2d' ),
    ctxCoverAfter = coverAfter.getContext( '2d' ),
    myFile = document.getElementById( 'myFile' ),
    loadFile = document.getElementById( 'loadFile' ),
    view,
    clampedArray,
    index = 0;

myFile.addEventListener( 'change', function ( e ) {

    var file = e.target.files[ 0 ];
    var fr = new FileReader();

    fr.addEventListener( "load", loadEvent );

    function loadEvent ( evt ) {

        if ( evt.target.readyState == FileReader.DONE ) {
            var arrayBuffer = evt.target.result;
            view = new Uint8Array( arrayBuffer );
        }

    }
    fr.readAsArrayBuffer( file );

});

hideData.addEventListener( 'click', function (e ) {

    var
        cover = document.getElementById( 'cover' ),
        file = cover.files[ 0 ],
        fr = new FileReader();

    fr.addEventListener( "load", loadEvent );
    fr.addEventListener( "loadend", loadEndEvent );

    function loadEvent ( e ) {
        console.info( 'load just start..wait for finish' );
    }

    function loadEndEvent ( e ) {
        console.info( 'finish' );
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            ctx.drawImage( img, 0, 0 );
            clampedArray = ctx.getImageData( 0, 0, canvas.height, canvas.width );
            console.log( clampedArray );
            console.log( view );
            readByte( view );
            ctxSecret.putImageData( clampedArray, 0, 0 );
        }

    }
    fr.readAsDataURL( file );

});

loadFile.addEventListener( 'change', function ( e ) {

    var file = e.target.files[ 0 ];
    var fr = new FileReader();

    fr.addEventListener( "loadend", loadEndEvent );

    function loadEndEvent ( e ) {

        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            ctxCoverAfter.drawImage( img, 0, 0 );
            var loadView = ctxCoverAfter.getImageData( 0, 0, coverAfter.height, coverAfter.width );
            console.log( loadView )
            var totalLength = 0;
            var lastIndex;
            for ( var b = 0, viewLength = loadView.data.length; b < viewLength; b++ ) {
                if (loadView.data[ b ] == 255) {
                    totalLength += loadView.data[ b ];
                    if (loadView.data[ b + 1 ] < 255) {
                        totalLength += loadView.data[ b + 1 ];
                        lastIndex = b + 1;
                        break;
                    }
                } else {
                    totalLength += loadView.data[ b ];
                    lastIndex = b;
                    break;
                }
            }
            console.info( 'Total length :' + totalLength + ', Last Index : ' + lastIndex )
            var secretLength = totalLength;
            var newUint8Array = new Uint8Array( totalLength / 4 );
            var j = 0;
            for ( var i = ( lastIndex + 1 ); i < secretLength; i = i + 4 ) {
                var aShift = ( loadView.data[ i ] & 3 );
                var bShift = ( loadView.data[ i + 1 ] & 3 ) << 2;
                var cShift = ( loadView.data[ i + 2 ] & 3 ) << 4;
                var dShift = ( loadView.data[ i + 3 ] & 3 ) << 6;
                var result = ( ( ( aShift | bShift) | cShift ) | dShift );
                newUint8Array[ j ] = result;
                j++;
            }
            console.log( newUint8Array )
            var result = decodeUtf8( newUint8Array );
            console.log( result )
            saveByteArray( result.split(''), 'isi.txt' );

        }

    }
    fr.readAsDataURL( file );

});
function readByte( secret ) {

    for ( var i = 0, length = secret.length; i < length; i++ ) {

        if ( i == 0 ) {
            var secretLength = length * 4;
            console.info( 'Secret Length(' + length + 'x4) : ' + secretLength )
            if ( secretLength > 255 ) {
                var division = secretLength / 255;
                if ( division % 1 === 0 ) {
                    for ( var k = 0; k < division; k++ ) {
                        clampedArray.data[ k ] = 255;
                        index++;
                    }
                }
                else {

                    var firstPortion = division.toString().split(".")[ 0 ];
                    var secondPortion = division.toString().split(".")[ 1 ];

                    for ( var k = 0; k < firstPortion; k++ ) {
                        clampedArray.data[ k ] = 255;
                        index++;
                    }

                    var numberLeft = Math.round( ( division - firstPortion ) * 255 );
                    console.info( 'numberLeft : ' + numberLeft )
                    clampedArray.data[ k ] = numberLeft;
                    index++;
                }

            } else {
                clampedArray.data[ 0 ] = secretLength;
                index++;
            }

            console.log( 'sss : ' + clampedArray.data[ 0 ] )

        }

        var asciiCode = secret[ i ];
        // use masking, to clear bit, and take the bit we want only
        // Take only first 2 bit, eg : 0111 0011 => 0000 0011
        var first2bit = ( asciiCode & 0x03 ); // 0x03 = 3
        // Take only first 4 bit(2bit at the end), eg : 0111 0011 => 0000 0000
        var first4bitMiddle = ( asciiCode & 0x0C ) >> 2; // 0x0C = 12, shift to the right 2 bit or divide by 2^2, as we want to take first 2 bit at the end
        // Take only first 6 bit(2bit at the end), eg : 0111 0011 => 0011 0000
        var first6bitMiddle = ( asciiCode & 0x30 ) >> 4; // 0x30 = 48, shift to the right 4 bit or divide by 2^4, as we want to take first 2 bit at the end
        // Take only first 8 bit(2bit at the end), eg : 0111 0011 => 0100 0000
        var first8bitMiddle = ( asciiCode & 0xC0 ) >> 6; // 0xC0 = 192, shift to the right 6 bit or divide by 2^6, as we want to take first 2 bit at the end
        //console.log(i + ' : ' + first2bit);
        //console.log(i + ' : ' + first4bitMiddle);
        //console.log(i + ' : ' + first6bitMiddle);
        //console.log(i + ' : ' + first8bitMiddle);
        // start replacing our secret's bit on LSB
        replaceByte( first2bit );
        replaceByte( first4bitMiddle );
        replaceByte( first6bitMiddle );
        replaceByte( first8bitMiddle );


    }
}

/**
* replace bits for each imageData's byte
*/
function replaceByte ( bits ) {
    // clear the first two bit(LSB) using &
    // and replacing with secret's bit
    clampedArray.data[ index ] = ( clampedArray.data[ index ] & 0xFC ) | bits;
    index++;

}
var saveByteArray = (function() {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function(data, name) {
        var blob = new Blob(data, {
                type: "octet/stream"
            }),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
/**
* decode character code into character
* http://ciaranj.blogspot.my/2007/11/utf8-characters-encoding-in-javascript.html
*/
function decodeUtf8(arrayBuffer) {
    var result = "";
    var i = 0;
    var c = 0;
    var c1 = 0;
    var c2 = 0;

    var data = new Uint8Array(arrayBuffer);

    // If we have a BOM skip it
    if (data.length >= 3 && data[0] === 0xef && data[1] === 0xBB && data[2] === 0xBF) {
        i = 3;
    }

    while (i < data.length) {
        c = data[i];

        if (c < 128) {
            result += String.fromCharCode(c);
            i++;
        } else if (c > 191 && c < 224) {
            if (i + 1 >= data.length) {
                throw "UTF-8 Decode failed. Two byte character was truncated.";
            }
            c2 = data[i + 1];
            result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            if (i + 2 >= data.length) {
                throw "UTF-8 Decode failed. Multi byte character was truncated.";
            }
            c2 = data[i + 1];
            c3 = data[i + 2];
            result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return result;
}
