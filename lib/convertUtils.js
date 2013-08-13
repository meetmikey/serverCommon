
var convertUtils = this;

exports.isString = function( input ) {
	if ( typeof input == 'string' ) {
		return true;
	}
	return false;
}

//Always returns a string value
exports.decimalToHex = function( decimalInput ) {
	
	var decimalString = decimalInput;
	if ( ! convertUtils.isString( decimalString ) ) {
		decimalString = decimalInput.toString();
	}

  var hex = convertUtils.convertBase( decimalString, 10, 16 );
  //return hex ? '0x' + hex : null;
  return hex;
}

//Always returns a string value
exports.hexToDecimal = function( hexInput ) {

	var hexString = hexInput;
	if ( ! convertUtils.isString( hexString ) ) {
		hexString = hexInput.toString();
	}

  if (hexString.substring(0, 2) === '0x') hexString = hexString.substring(2);
  hexString = hexString.toLowerCase();
  return convertUtils.convertBase(hexString, 16, 10);
}

// Adds two arrays for the given base (10 or 16), returning the result.
// This turns out to be the only "primitive" operation we need.
exports.add = function( x, y, base ) {
  var z = [];
  var n = Math.max(x.length, y.length);
  var carry = 0;
  var i = 0;
  while (i < n || carry) {
    var xi = i < x.length ? x[i] : 0;
    var yi = i < y.length ? y[i] : 0;
    var zi = carry + xi + yi;
    z.push(zi % base);
    carry = Math.floor(zi / base);
    i++;
  }
  return z;
}

// Returns a*x, where x is an array of decimal digits and a is an ordinary
// JavaScript number. base is the number base of the array x.
exports.multiplyByNumber = function( num, x, base ) {
  if (num < 0) return null;
  if (num == 0) return [];

  var result = [];
  var power = x;
  while (true) {
    if (num & 1) {
      result = convertUtils.add(result, power, base);
    }
    num = num >> 1;
    if (num === 0) break;
    power = convertUtils.add(power, power, base);
  }

  return result;
}

exports.parseToDigitsArray = function( str, base ) {
  var digits = str.split('');
  var ary = [];
  for (var i = digits.length - 1; i >= 0; i--) {
    var n = parseInt(digits[i], base);
    if (isNaN(n)) return null;
    ary.push(n);
  }
  return ary;
}

exports.convertBase = function( str, fromBase, toBase ) {
  var digits = convertUtils.parseToDigitsArray(str, fromBase);
  if (digits === null) return null;

  var outArray = [];
  var power = [1];
  for (var i = 0; i < digits.length; i++) {
    // invariant: at this point, fromBase^i = power
    if (digits[i]) {
      outArray = convertUtils.add(outArray, convertUtils.multiplyByNumber(digits[i], power, toBase), toBase);
    }
    power = convertUtils.multiplyByNumber(fromBase, power, toBase);
  }

  var out = '';
  for (var i = outArray.length - 1; i >= 0; i--) {
    out += outArray[i].toString(toBase);
  }
  return out;
}