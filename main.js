"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const fs = require("fs");
const WebSocket = require("ws");
const adapter = utils.Adapter("signalclirestapiclient");
const needle = require("needle");
// eslint-disable-next-line no-unused-vars
const { Adapter } = require("@iobroker/adapter-core");
let ws = null;

// Load your modules here, e.g.:

class Signalclirestapiclient extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "signalclirestapiclient",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	async onReady() {
		// Initialize your adapter here
		this.setState("info.connection", false, true);

		ws = new WebSocket("ws://"+adapter.config.serverIP+":"+adapter.config.serverPort+"/v1/receive/"+adapter.config.signalNumber);

		ws.on("open", () => {
			adapter.log.debug("SignalRestAPI Webscocket: Connected");
			adapter.setState("info.connection", true, true);
		});

		ws.on("error", () => {
			adapter.log.error("SignalRestAPI Webscocket:  not Connected");
			adapter.setState("info.connection", false, true);
			adapter.disable();
		});

		ws.on("message", function message(jsonData) {

			const parsedJSON = JSON.parse(jsonData.toString()).envelope;

			if (typeof parsedJSON.dataMessage != "undefined") {
				const message = parsedJSON.dataMessage.message;
				const name = parsedJSON.sourceName;
				handleMsg(name, message);
			}
		});

		function handleMsg(name, msg) {
			adapter.log.debug("Neue Nachricht: "+ msg);
			adapter.setState("messages.message", msg, true);
			adapter.setState("messages.from", name, true);
		}
	}



	sendNewMessage (path, body_sent) {

		const options = {
			headers: {"Content-Type": "application/json"}
		};

		needle.post(adapter.config.serverIP+":"+adapter.config.serverPort+path, body_sent, options)
			.then(function(response) {
				return resp(response);
			})
			.catch(function(err){
				adapter.log.error("Senden der Anfrage fehlgeschlagen: "+err);
			});

		const resp = function(resp) {
			switch(resp.statusCode){
				case "201":
					adapter.log.debug(resp.statusCode+" Anfrage erfolgreich.");
					break;
				case "400":
					adapter.log.error(resp.statusCode+" Anfrage konnte nicht gesendet werden!");
					break;
				case "500":
					adapter.log.error(resp.statusCode+" Interner Serverfehler");
					break;
			}
		};
	}


	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			ws.close();
			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	onMessage(obj) {
		let body_sent;
		if (typeof obj === "object" && obj.message) {
			switch(obj.command){
				case "send":
					if(typeof obj.message.attachment !== "undefined"){
						body_sent =	{"message": obj.message.text,
							"number": adapter.config.signalNumber,
							"recipients": obj.message.numbers,
							"base64_attachments": [fs.readFileSync(obj.message.attachment, "base64")]};
					}else{
						body_sent =	{"message": obj.message.text,
							"number": adapter.config.signalNumber,
							"recipients": obj.message.numbers};
					}
					this.sendNewMessage("/v2/send",body_sent);
					break;
				case "addGroup":
					break;
				case "addAdminGroup":
					break;
				case "addMemberGroup":
					break;
				case "delAdminGroup":
					break;
				case "delMemberGroup":
					break;
				case "delGroup":
					break;
			}
		}
	}
}

if (require.main !== module) {
// Export the constructor in compact mode
/**
 * @param {Partial<utils.AdapterOptions>} [options={}]
 */
	module.exports = (options) => new Signalclirestapiclient(options);
} else {
// otherwise start the instance directly
	new Signalclirestapiclient();
}