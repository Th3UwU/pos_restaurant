import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;

// Form container
let form = document.getElementById('form') as HTMLDivElement;
let form_order = document.getElementById('form_order') as HTMLDivElement;

async function MAIN(): Promise<void> {

	let delivery = document.createElement('span') as HTMLSpanElement;
	delivery.id = 'delivery';
	delivery.dataset.deliveryId = '0';
	form.appendChild(delivery);

	let select_delivery_button = document.createElement('button') as HTMLButtonElement;
	select_delivery_button.innerHTML = 'Seleccionar repartidor';
	select_delivery_button.addEventListener('click', (): void => {

		// Set aux target
		main.setProperty({...main.aux, column: 'empleado_repartidor'}, 'aux');

		// Create query window
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('delivery').innerHTML = main.aux.returnName;
			document.getElementById('delivery').dataset.deliveryId = main.aux.return;
		}
		catch (error)
		{
			document.getElementById('delivery').innerHTML = main.aux.returnName;
			document.getElementById('delivery').dataset.deliveryId = main.aux.return;
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});
	form.appendChild(select_delivery_button);

	button_cancel.addEventListener('click', (): void => {
		getCurrentWindow().close();
	});
}
MAIN();
