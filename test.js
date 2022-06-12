/*
 * Copyright 2022 Jean-David Caprace <jd.caprace@gmail.com>
 *
 * Add the MIT license
 */

//https://www.npmjs.com/package/oled-i2c-bus
//https://github.com/baltazorr/oled-i2c-bus
const ssd1306 = require('oled-i2c-bus');
var i2c = require('i2c-bus');
var font = require('oled-font-5x7');

var opts = {
  width: 128, // screen width
  height: 64, // screen height
  address: 0x3C, // Pass I2C address of screen if it is not the default of 0x3C
};

var bus = i2c.openSync(1);
var oled = new ssd1306(bus, opts);

//oled.turnOnDisplay();
oled.turnOffDisplay();

//Fills the buffer with 'off' pixels (0x00). Optional bool argument specifies whether screen updates immediately with result. Default is true.
oled.clearDisplay();

//Lowers the contrast on the display. This method takes one argument, a boolean. True for dimming, false to restore normal contrast.
oled.dimDisplay(false);     
    
//Inverts the pixels on the display. Black becomes white, white becomes black. This method takes one argument, a boolean. True for inverted state, false to restore normal pixel colors.
oled.invertDisplay(false);

//Draws a pixel at a specified position on the display. This method takes one argument: a multi-dimensional array containing either one or more sets of pixels.
//Each pixel needs an x position, a y position, and a color. Colors can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.
//Optional bool as last argument specifies whether screen updates immediately with result. Default is true.
// draws 4 white pixels total
// format: [x, y, color]

//oled.drawPixel([
//	[128, 1, 1],
//	[128, 32, 1],
//	[128, 16, 1],
//	[64, 16, 1]
//]);

//Writes a string of text to the display.
//Call setCursor() just before, if you need to set starting text position.
//Arguments:
//obj font - font object in JSON format (see note below on sourcing a font)
//int size - font size, as multiplier. Eg. 2 would double size, 3 would triple etc.
//string text - the actual text you want to show on the display.
//int color - color of text. Can be specified as either 0 for 'off' or black, and 1 or 255 for 'on' or white.
//bool wrapping - true applies word wrapping at the screen limit, false for no wrapping. If a long string without spaces is supplied as the text, just letter wrapping will apply instead.
//int linespacing - amount of spacing between lines of text on the screen. Negative numbers are also ok.
//Optional bool as last argument specifies whether screen updates immediately with result. Default is true.
//Before all of this text can happen, you need to load a font buffer for use. A good font to start with is NodeJS package oled-font-5x7.



// sets cursor to x = 1, y = 1
//oled.setCursor(1, 18);
//oled.writeString(font, 1, 'LAT: 000000000000', 26, true);
//oled.setCursor(1, 28);
//oled.writeString(font, 1, 'LON: 000000000000', 26, true);
//oled.setCursor(1, 38);
//oled.writeString(font, 1, 'COG: 000000000000', 26, true);
//oled.setCursor(1, 48);
//oled.writeString(font, 1, 'SOG: 000000000000', 26, true);

