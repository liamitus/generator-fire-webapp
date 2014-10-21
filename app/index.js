"use strict";

// --------------------------------------------------------------------- Imports

var yeoman = require("yeoman-generator");
var chalk = require("chalk");

// -------------------------------------------------------------------- Settings

var config = {
	src: "app",
	dest: "build"
};

// -------------------------------------------------------------- Helper methods

var WebappGenBase = yeoman.generators.Base.extend({

	// SPecifies whenther or not existing config was found.
	usingPreexistingConfig: false,

	promptForExistingConfig: function () {		
		var configJSON = this.config.get("project_config");
		this.log("Existing project configurations found:");
		this.usingPreexistingConfig = true;
		this.promptForConfigConfirmation();
	},

	promptForNewConfig: function (callback) {
		var questions = [
			{
				type: "input",
				name: "project_name",
				message: "What is the name of the project",
				default: this.appname // Default to current folder.
			},
			{
				type: "list",
				name: "language",
				message: "What language are you using?",
				choices: [ "HTML", "Java", "JavaScript", "PHP", "Python", "Ruby" ],
				filter: function( val ) {
					return val.toLowerCase();
				}
			},
			{
				type: "confirm",
				name: "usingNode",
				message: "Is this a Node.js project?",
				default: true,
				when: function( answers ) {
				  return answers.language === "javascript";
				}
			},
			{
				type: "confirm",
				name: "usingRails",
				message: "Are you using Ruby on Rails?",
				default: true,
				when: function( answers ) {
				  return answers.language === "ruby";
				}
			},
			{
				type: "list",
				name: "jspOrFacelets",
				message: "Which Java web template system?",
				choices: [ "JSP", "Facelets" ],
				when: function( answers ) {
				  return answers.language === "java";
				},
				filter: function( val ) { return val.toLowerCase(); }
			},
			{
				type: "list",
				name: "build_system",
				message: "What build system are you using?",
				choices: [ "Grunt", "Gulp"],
				when: function( answers ) {
				  return answers.language === "javascript";
				},
				filter: function( val ) {
					return val.toLowerCase();
				}
			},
			{
				type: "list",
				name: "build_system",
				message: "What build system are you using?",
				choices: [ "Ant", "Gradle", "Maven" ],
				when: function( answers ) {
				  return answers.language === "java";
				},
				filter: function( val ) {
					return val.toLowerCase();
				}
			},
		];
		var done = callback || this.async();
		this.prompt(questions, function (answers) {			
			this.config.set("project_config", answers);
			this.promptForConfigConfirmation(done);
		}.bind(this));
	},

	promptForConfigConfirmation: function (callback) {		
		var configJSON = this.config.get("project_config");
		this.log(JSON.stringify(configJSON, null, "  "));
		var questions = [
			{
				type: "confirm",
				name: "useExistingConfig",
				message: "Would you like to use these configurations?",
				default: true
			}
		];
		var done = callback || this.async();
		this.prompt(questions, function (answers) {			
			if (answers.useExistingConfig === false) {
				this.config.delete("project_config");
				this.usingPreexistingConfig = false;
				this.logHeader(chalk.green("Setting up new project configuration."));
				this.promptForNewConfig(callback);
			} else {
				done();
			}
		}.bind(this));
	},

	createSrcDirectory: function () {
		var ctx = this;
		ctx.log(chalk.yellow("Creating", config.src, "..."));
	    this.mkdir(config.src);
	    ctx.log(chalk.yellow(config.src, "created successfully."));
	},

	logHeader: function () {
		var argArray = this.objectToArray(arguments);
		this.log();
		this.log(argArray.join(" "));
		this.log();
	},

	objectToArray: function (obj) {
		return Array.prototype.slice.call(obj);
	},

	// Returns an array of fire components found in the package dependencies.
	getFireComponentNames: function () {
		var allDependencies = Object.keys(this.pkg.dependencies);
		var fireComponents = allDependencies.filter(function (entry) {
			return entry.indexOf("generator-fire") === 0;
		});
		// Strip the "generator-" part of the component name.
		fireComponents.forEach(function(part, index, arr) {
			arr[index] = part.slice(10);
		});
		return fireComponents;
	}

});

// ----------------------------------------------------------------- Main action

module.exports = WebappGenBase.extend({	

	constructor: function () {
		// Call the super constructor.
		yeoman.generators.Base.apply(this, arguments);

		this.option("clean", {
			desc: "Clean the project (useful for debugging the generator)",
			type: Boolean,
			defaults: false
		});
		this.clean = this.options.clean;

		this.pkg = require("../package.json");
	},

	// Cleans the build by removing any files added by components.
	clean: function () {
		if (this.clean) {
			this.logHeader(chalk.yellow("Cleaning the build..."));

			var dependencies = this.getFireComponentNames();
			var ctx = this;
			var options = {
				options: {
					clean: true,
					exitAfterClean: false
				}
			};
			var settings = {};
			dependencies.forEach(function (component) {
				ctx.composeWith(component, options, settings);
			});
		}
	},

	exitAfterClean: function () {
		if (this.clean) {
			this.logHeader(chalk.green("Cleanup complete!"));
			// Exit the generator.
			process.exit(0);			
		}
	},

	// Prints the webcome message.
	welcomeMessage: function () {
		this.logHeader("So you are making a new", chalk.red("fire"), "web project?");
	},

	promting: function () {
		if (this.config.get("project_config")) {
			this.promptForExistingConfig();
		} else {
			this.promptForNewConfig();
		}
	},

	writing: function () {
		this.logHeader(chalk.red("Firing"), chalk.yellow("up your web project..."));
		this.createSrcDirectory();
		this.src.copy("favicon.ico", "app/favicon.ico");
		this.template("index.html", "app/index.html");
	},

	composing: function () {
		var configJSON = this.config.get("project_config");
		var options = {};
		var settings = {};
		if (configJSON.build_system === "grunt") {
			this.composeWith("fire-grunt", {}, {});			
		}
	}

});