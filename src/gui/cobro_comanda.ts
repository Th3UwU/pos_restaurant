import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');


let section_1 = document.getElementById('section_1') as HTMLDivElement;
let section_2 = document.getElementById('section_2') as HTMLDivElement;

// 1
let button_update = document.getElementById('button_update') as HTMLButtonElement;
let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let id_order: number = 0;

// 2
let total_pay = document.getElementById('total_pay') as HTMLSpanElement;
let button_confirm = document.getElementById('button_confirm') as HTMLButtonElement;

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
			document.getElementById('delivery').innerHTML = main.aux.return.nombre;
			document.getElementById('delivery').dataset.deliveryId = main.aux.return.id_empleado;
		}
		catch (error) {}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});
	form.appendChild(select_delivery_button);

	// Section select orders
	button_update.addEventListener('click', async (): Promise<void> => {

		form_order.innerHTML = '';

		console.log('updating list');
		let ordersQuery = (await main.querySQL(`SELECT * FROM comanda WHERE estatus = 'e' AND NOT id_comanda = 0 AND fk_empleado = ${delivery.dataset.deliveryId};`)).rows;
		for (const o of ordersQuery) {
			
	
			// Order cost
			let orderCost: number = 0;
			let orderDetails = (await main.querySQL(`SELECT * FROM platillo_comanda WHERE fk_comanda = ${o.id_comanda};`)).rows;
			for (const od of orderDetails)
				orderCost += (parseInt(od.cantidad) * parseFloat(od.costo));
	
			// ID
			let id: string = `id_order_${id_order}`;
			let inputContainer = document.createElement('div') as HTMLDivElement;
			inputContainer.style.display = 'block';
			inputContainer.className = 'order';
	
			// Checkbox
			let checkbox = document.createElement('input') as HTMLInputElement;
			checkbox.id = id;
			checkbox.style.display = 'block';
			checkbox.className = 'delivery_checkbox';
			checkbox.type = 'checkbox';
			checkbox.dataset.orderId = o.id_comanda;
			checkbox.dataset.orderCost = `${orderCost}`;
			id_order++;
			inputContainer.appendChild(checkbox);
	
			// Span
			let checkbox_span = document.createElement('span') as HTMLSpanElement;
			checkbox_span.style.display = 'block';
			checkbox_span.innerHTML = `${o.nombre_cliente} - ${o.hora_entrega} - ${(o.fecha as Date).toISOString().substring(0, 10)} - $${orderCost}`;
			inputContainer.appendChild(checkbox_span);
	
			form_order.appendChild(inputContainer);
		}
	});

	// Accept button
	button_accept.addEventListener('click', async (): Promise<void> => {
		
		let atLeastOne: boolean = false;
		let checkboxes = document.getElementsByClassName('delivery_checkbox') as HTMLCollectionOf<HTMLInputElement>;
		for (const c of checkboxes) {
			if (c.checked)
				atLeastOne = true;
		}

		if (delivery.dataset.deliveryId == '0')
			{dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Seleccione un repartidor", type: "error"}); return;}

		if (!atLeastOne)
			{dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Seleccione por lo menos un cliente", type: "error"}); return;}

		section_1.style.display = 'none';
		section_2.style.display = 'block';

		let totalCost: number = 0;
		for (const c of checkboxes)
		{
			if (c.checked)
				totalCost += parseInt(c.dataset.orderCost);
		}
		total_pay.innerHTML = `TOTAL A COBRAR: $${totalCost}`;
	});

	// Confirm button
	button_confirm.addEventListener('click', async (): Promise<void> => {

		let querys: string[] = [];
		let checkboxes = document.getElementsByClassName('delivery_checkbox') as HTMLCollectionOf<HTMLInputElement>;
		// get checkboxes
		for (const c of checkboxes)
			if (c.checked)
			querys.push(`UPDATE comanda SET estatus = 'g' WHERE id_comanda = ${c.dataset.orderId};`);

		try {
			for (const c of querys) {
				console.log(c);
				await main.querySQL(c);
			}
			dialog.showMessageBoxSync(null, {title: "Éxito", message: "Registro exitoso", type: "info"});
			getCurrentWindow().close();
		}
		catch (error: any)
		{
			console.log(error);
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
		}

	});

	// Cancel button
	button_cancel.addEventListener('click', (): void => {
		getCurrentWindow().close();
	});

}
MAIN();