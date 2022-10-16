![Logo](admin/signalclirestapiclient.png)
# ioBroker.signalclirestapiclient

[![NPM version](https://img.shields.io/npm/v/iobroker.signalclirestapiclient.svg)](https://www.npmjs.com/package/iobroker.signalclirestapiclient)
[![Downloads](https://img.shields.io/npm/dm/iobroker.signalclirestapiclient.svg)](https://www.npmjs.com/package/iobroker.signalclirestapiclient)
![Number of Installations](https://iobroker.live/badges/signalclirestapiclient-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/signalclirestapiclient-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.signalclirestapiclient.png?downloads=true)](https://nodei.co/npm/iobroker.signalclirestapiclient/)

**Tests:** ![Test and Release](https://github.com/mericon/ioBroker.signalclirestapiclient/workflows/Test%20and%20Release/badge.svg)

## signalclirestapiclient adapter for ioBroker

Client for the Docker Signal-cli Rest API

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 0.1.3-alpha.1 (2022-10-16)
* (Carsten) Fix Changed Icon
* (Carsten) Fix ESlint errors
* (Carsten) Fix Object warnings
* (Carsten) Fix message Sending

### 0.1.3-alpha.0 (2022-10-15)
* (Carsten) Changed Icon
* (Carsten) Code Cleanup

### 0.1.2-alpha.0 (2022-10-14)
* (Carsten) Blockly eingepflegt

### 0.1.1-alpha.0 (2022-10-14)
* (Carsten) Fixing Attachments

### 0.1.0-alpha.0 (2022-10-14)
* (Carsten) initial release

### How to setup this Adapter

1.) Install the Signal-cli-Restapi Docker: https://github.com/bbernhard/signal-cli-rest-api

2.) Configure the Docker and Register the Outgoing number

3.) Make shure that the Docker is runnig with MODE=json-rpc

4.) Configure the Adapter: Server IP, Server Port, Outgoing number

5.) Use sendTo to send a message:

		sendTo("signalclirestapiclient.0", "send", {
   				"text": 'This is only a test',
   				"numbers": ["+44PHONENUMBER"]
			});

or with an attachment:

		sendTo("signalclirestapiclient.0", "send", {
   				"text": 'This is only a test',
   				"numbers": ["+44PHONENUMBER"],
				"attachment": path/to/file
			});

## License
MIT License

Copyright (c) 2022 Carsteb <graf.carsten@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.