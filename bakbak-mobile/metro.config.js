const { getDefaultConfig } = require('expo/metro-config');

let withNativeWind;
try {
	({ withNativeWind } = require('nativewind/metro'));
} catch (e) {
	withNativeWind = null;
}

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind
	? withNativeWind(config, { input: './global.css' })
	: config;
