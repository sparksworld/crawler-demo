var ora = require("ora");
var chalk = require("chalk");
module.exports = function () {
	this.spinner = ora({
		// spinner: {
		// interval: 80, // Optional
		// frames: ['-', '+', '-']
		// }
	});

	this.start = function (message, color) {
		this.spinner.start();
		this.spinner.text = color ? chalk[color](message) : message;
	};
	this.setText = function (message, color) {
		this.spinner.text = color ? chalk[color](message) : message;
	};
	this.stop = function () {
		this.spinner.stop();
	};
	this.warn = function (message, color) {
		this.spinner.warn(chalk[color](message));
	};
	this.succeed = function (message, color = "green") {
		this.spinner.succeed(chalk[color](message));
	};
	this.fail = function (message, color = "red") {
		this.spinner.fail(chalk[color](message));
	};
};
