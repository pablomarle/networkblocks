const config_manager = require('./lib/config_manager')
const app = require('./app')

const ARGS_HELP = `
NetworkMaps Manager. Developed by Pablo Martin Leon for a better world.

Arguments:
   --help                       : show help
   --config <config file path>  : config file to be used
`

function process_args(args) {
	let processed_args = {
		help: false,
		config: "/etc/networkmaps_manager/config.json"
	};
	let current_arg_index = 0;

	while(current_arg_index < args.length) {
		if(args[current_arg_index] == "--help")
			processed_args.help = true;
		else if((args[current_arg_index] == "--config") && ((current_arg_index+1) < args.length)) {
			current_arg_index++;
			processed_args.config = args[current_arg_index];
		}
		else
			return null;

		current_arg_index++;
	}

	return processed_args;
}

function main() {
	// Process arguments
	let args = process_args(process.argv.slice(2));
	if(args === null) {
		console.log("Invalid arguments");
		console.log(ARGS_HELP);
		return;
	}
	else if(args.help) {
		console.log(ARGS_HELP);
		return;
	}
	// Load configuration file
	let config = config_manager.load_config(args.config);
	if(config == null)
		return;

	// Start the app server
	app.start_app(config);
}

if (require.main === module) {
	main();
}
