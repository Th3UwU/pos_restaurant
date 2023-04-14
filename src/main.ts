import { app, BrowserWindow } from 'electron';
import { initialize } from '@electron/remote/main'
import { Client, Query, QueryResult } from 'pg'
import Window from './window'

type Credentials = {
	idEmployee: number;
	role: string;
};

class Main {

	window: BrowserWindow = null;
	client: Client = null;
	aux: any = null;

	credentials = <Credentials>({
		idEmployee: 0,
		role: ''
	 });

	constructor() {
		app.on('window-all-closed', this.onWindowAllClosed.bind(this));
		app.on('ready', this.onReady.bind(this));
		process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

		initialize();
	}

	async connectDB() {

		console.log("Connecting...");
		this.client = new Client
		({
			user: "postgres",
			host: "localhost",
			database: "rest",
			port: 5432
		});
		await this.client.connect();
	}

	async disconnectDB() {
		console.log("Disconnecting...");
		await this.client.end();
	}

	createWindow(width: number, height: number, source: string, parent: BrowserWindow = null): Window {
		let window: Window = new Window(width, height, source, parent);
		return window;
	}

	async querySQL(query: string): Promise<QueryResult<any>> {
		return (await this.client.query(query));
	}

	setGlobal(value: any, name: string) {
		global[name] = value;
	}

	setProperty(value: any, name: string) {
		this[name] = value;
	}
	
	onWindowAllClosed() {
		this.disconnectDB();
		app.quit();
	}

	onClose() {
		this.window = null;
	}

	onReady() {

		this.connectDB();
		this.aux = {action: 'm', id: 1, column: 'empleado', return: null};
		// this.createWindow(800, 600, 'gui/am.html', this.window);
		// this.createWindow(800, 600, 'gui/query.html', this.window);
		this.createWindow(800, 600, 'gui/am_insumo.html', this.window);
	}
}

export { Main, Credentials };

// MAIN PROCESS
global.main = new Main();
