"use strict";

/*
	Fire Web App

	Prompts a user for new web app configurations. Calls appropriate
	sub-generators to build the project.

	Author:	Liam Howell <lhowell@mobiquityinc.com>
	Since:	10-30-2014
*/

// --------------------------------------------------------------------- Imports

var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var yosay = require("yosay");

// -------------------------------------------------------------------- Settings

var config = {
	src: "app",
	dest: "build"
};

// -------------------------------------------------------------- Helper methods

var WebappGenBase = yeoman.generators.Base.extend({

	// SPecifies whenther or not existing config was found.
	usingPreexistingConfig: false,


	// Prompt the user for existing config, if found.
	// This method assumes config already exists.
	promptForExistingConfig: function () {		
		var configJSON = this.config.get("project_config");
		this.log("Existing project configurations found:");
		this.usingPreexistingConfig = true;
		this.promptForConfigConfirmation();
	},

	// Prompt the user for new project configurations.
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
			{
				type: "confirm",
				name: "usingBootstrap",
				message: "Will you need Bootstrap? (recommended)",
				default: true
			}
		];
		var done = callback || this.async();
		this.prompt(questions, function (answers) {			
			this.config.set("project_config", answers);
			this.promptForConfigConfirmation(done);
		}.bind(this));
	},

	// Prompt the user to confirm their choice of project configurations.
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
				this.logHeader(chalk.red("Firing"), chalk.yellow("up your web project..."));
				done();
			}
		}.bind(this));
	},

	// Create the source directory for the app.
	createSrcDirectory: function () {
		var ctx = this;
		ctx.log(chalk.yellow("Creating", config.src, "directory..."));
	    this.mkdir(config.src);
	},

	// Utility method to log with space above and below the message.
	logHeader: function () {
		var argArray = this.objectToArray(arguments);
		this.log();
		this.log(argArray.join(" "));
		this.log();
	},

	// Convert a given object to an array.
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
	},

	composeWithJS: function (configJSON) {
		var options = {
			args: JSON.stringify(configJSON)
		};
		var settings = {};
		this.composeWith("fire-js", options, settings);	
	},

	composeWithBootstrap: function (configJSON) {
		var options = {
			args: JSON.stringify(configJSON)
		};
		var settings = {
			// local: require.resolve("generator-fire-grunt")
		};
		this.composeWith("fire-bootstrap", options, settings);	
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

	// Exit the generator if the clean option is enabled (and complete).
	exitAfterClean: function () {
		if (this.clean) {
			this.logHeader(chalk.green("Cleanup complete!"));
			// Exit the generator.
			process.exit(0);			
		}
	},

	// Prints the webcome message.
	welcomeMessage: function () {
		// Have Yeoman greet the user.
		this.log(yosay(
			chalk.yellow("So you are making a ")
			+ chalk.red("fire")
			+ chalk.yellow(" web project?")
		));
	},

	// Begin the user prompt cycle.
	promting: function () {
		if (this.config.get("project_config")) {
			this.promptForExistingConfig();
		} else {
			this.promptForNewConfig();
		}
	},

	packageJSON: function () {
		this.template('_package.json', 'package.json');
	},

	// Write files and folders to the project.
	writing: function () {
		this.createSrcDirectory();
		this.copy("bowerrc", ".bowerrc");
		this.copy("favicon.ico", "app/favicon.ico");
		this.template("index.html", "app/index.html");
	},

	// Bring JS into the mix.
	composeJS: function () {
		var configJSON = this.config.get("project_config");
		if (configJSON.language === "javascript") {
			this.composeWithJS(configJSON);			
		}
		if (configJSON.usingBootstrap === true) {
			this.composeWithBootstrap(configJSON);	
		}
	},

	install: function () {
		this.on('end', function () {
			if (!this.options['skip-install']) {
				this.installDependencies({
					//skipMessage: this.options['skip-install-message'],
					//skipInstall: this.options['skip-install']
				});
			}
		});
	}

});