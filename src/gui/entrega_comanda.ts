import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let id_order: number = 0;

// Form container
let form = document.getElementById('form') as HTMLDivElement;
let form_order = document.getElementById('form_order') as HTMLDivElement;

async function MAIN(): Promise<void> {


	// Delivery section
	let delivery = document.createElement('span') as HTMLSpanElement;
	delivery.id = 'delivery';
	delivery.dataset.deliveryId = '0';
	delivery.style.display = 'block';
	form.appendChild(delivery);

	let select_delivery_button = document.createElement('button') as HTMLButtonElement;
	select_delivery_button.innerHTML = 'Seleccionar repartidor';
	select_delivery_button.addEventListener('click', (): void => {

		// Set aux target
		main.setProperty({...main.aux, column: 'empleado_repartidor', canSelect: true}, 'aux');

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

	// Section select orders
	let ordersQuery = (await main.querySQL(`SELECT * FROM comanda WHERE estatus = 'p' AND NOT id_comanda = 0;`)).rows;
	for (const o of ordersQuery) {

		let id: string = `id_order_${id_order}`;
		let inputContainer = document.createElement('div') as HTMLDivElement;
		inputContainer.style.display = 'block';
		inputContainer.className = 'order';

		let checkbox = document.createElement('input') as HTMLInputElement;
		checkbox.id = id;
		checkbox.style.display = 'block';
		checkbox.className = 'delivery_checkbox';
		checkbox.type = 'checkbox';
		checkbox.dataset.orderId = o.id_comanda;
		id_order++;
		inputContainer.appendChild(checkbox);

		let checkbox_span = document.createElement('span') as HTMLSpanElement;
		checkbox_span.style.display = 'block';
		checkbox_span.innerHTML = `${o.nombre_cliente} - ${o.hora_entrega} - ${(o.fecha as Date).toISOString().substring(0, 10)}`;
		inputContainer.appendChild(checkbox_span);

		form_order.appendChild(inputContainer);
	}


	// Accept button
	button_accept.addEventListener('click', async (): Promise<void> => {
		
		let querys: string[] = [];
		// get checkboxes
		let checkboxes = document.getElementsByClassName('delivery_checkbox') as HTMLCollectionOf<HTMLInputElement>;
		for (const c of checkboxes)
			if (c.checked)
			querys.push(`UPDATE comanda SET estatus = 'e', fk_empleado = ${delivery.dataset.deliveryId} WHERE id_comanda = ${c.dataset.orderId};`);

		try {
			for (const c of querys) {
				console.log(c);
				await main.querySQL(c);
			}
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
		}
		catch (error: any)
		{
			console.log(error);
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
		}

	});

	button_cancel.addEventListener('click', (): void => {
		getCurrentWindow().close();
	});
}
MAIN();
