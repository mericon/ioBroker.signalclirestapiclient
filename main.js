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
			this.sendToAPI("get","/v1/groups/"+adapter.config.signalNumber);
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

	sendToAPI (type,path, body_sent) {

		const options = {
			headers: {"Content-Type": "application/json"}
		};

		needle(type,adapter.config.serverIP+":"+adapter.config.serverPort+path, body_sent, options)
			.then((response) => resp(response))
			.catch(function(err){
				adapter.log.error("Senden der Anfrage fehlgeschlagen: "+err);
			});

		const resp = function(resp) {
			switch(resp.statusCode){
				case 200:
				case 201:
					adapter.log.debug(resp.statusCode+" Anfrage erfolgreich.");
					if(Array.isArray(resp.body)){
						if(resp.body[0].id != "undefined"){
							const groups = {};
							resp.body.forEach(item => groups[item.name] = item.id);
							adapter.setState("info.groups", JSON.stringify(groups),true);
							adapter.log.debug(JSON.stringify(groups));
						}
					}
					break;
				case 400:
				case 401:
					adapter.log.error(resp.statusCode + " Fehler bei der Kommunikation mit der API");
					break;
				case 500:
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
					this.sendToAPI("post","/v2/send",body_sent);
					break;
				case "addGroup":
					body_sent =	{"name": obj.message.name,
						"members": [obj.message.member]
					};
					this.sendToAPI("post", "/v1/groups/"+adapter.config.signalNumber, body_sent);
					break;
				case "getGroups":
					this.sendToAPI("get","/v1/groups/"+adapter.config.signalNumber);
					break;
				case "sendGroup":{
					adapter.getState("info.groups",  (err, state) => {
						// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						let body_sent;
						if(typeof obj.message.attachment !== "undefined"){
							body_sent =	{"message": obj.message.text,
								"number": adapter.config.signalNumber,
								"recipients": [gid],
								"base64_attachments": [fs.readFileSync(obj.message.attachment, "base64")]};
						}else{
							body_sent =	{"message": obj.message.text,
								"number": adapter.config.signalNumber,
								"recipients": [gid]};
						}
						this.sendToAPI("post","/v2/send",body_sent);
					});
				}
					break;
				case "addAdminGroup":
					adapter.getState("info.groups",  (err, state) => {
						// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						this.sendToAPI("post", "/v1/groups/"+adapter.config.signalNumber+"/"+gid+"/admins", {"admins": [obj.message.admin]});
					});
					break;
				case "addMemberGroup":
					adapter.getState("info.groups",  (err, state) => {
					// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						this.sendToAPI("post", "/v1/groups/"+adapter.config.signalNumber+"/"+gid+"/members", {"members": [obj.message.member]});
					});
					break;
				case "delAdminGroup":
					adapter.getState("info.groups",  (err, state) => {
						// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						this.sendToAPI("delete", "/v1/groups/"+adapter.config.signalNumber+"/"+gid+"/admins", {"admins": [obj.message.admin]});
					});
					break;
				case "delMemberGroup":
					adapter.getState("info.groups",  (err, state) => {
						// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						this.sendToAPI("post", "/v1/groups/"+adapter.config.signalNumber+"/"+gid+"/members", {"members": [obj.message.admin]});
					});
					break;
				case "delGroup":
					adapter.getState("info.groups",  (err, state) => {
						// @ts-ignore
						const gid = JSON.parse(state.val)[obj.message.group];
						this.sendToAPI("delete", "/v1/groups/"+adapter.config.signalNumber+"/"+gid);
					});
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