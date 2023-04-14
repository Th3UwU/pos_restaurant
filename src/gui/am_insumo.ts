import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let button_add_supplier = document.getElementById('button_add_supplier') as HTMLButtonElement;
let id_supp: number = 0;

// Form container
let form = document.getElementById('form') as HTMLDivElement;
let form_suppliers = document.getElementById('form_suppliers') as HTMLDivElement;

async function MAIN(): Promise<void> {

	// Retrieve column info
	let column: Column[] = await getColumnInfo('insumo');


	// Create HTML inputs, Ignore the first one (ID)
	for (let i = 1; i < column.length; i++) {

		let inputContainer = document.createElement('div') as HTMLDivElement;
		let id: string = `input_${column[i].name}`;

		// Input label
		let inputLabel = document.createElement('label') as HTMLLabelElement;
		inputLabel.innerHTML = `${column[i].name}`;
		inputLabel.setAttribute('for', id);
		inputContainer.appendChild(inputLabel);

		switch (column[i].type) {

			case 'integer': case 'bigint': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'number';
				input.min = '0';
				input.value = '0';
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'text': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'text';
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'boolean': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'checkbox';
				input.checked = true;
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

		};
	}

	if (main.aux.action == 'a')
	{
		// Accept button
		let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
		button_accept.addEventListener('click', async (): Promise<void> => {

			let query: string = `INSERT INTO insumo VALUES((SELECT MAX(id_insumo) FROM insumo) + 1`;
			for (let i = 1; i < column.length; i++) {
				
				let id: string = `input_${column[i].name}`;

				switch (column[i].type) {

					case 'integer': case 'bigint': case 'text':
						query += `, '${(document.getElementById(id) as HTMLInputElement).value}'`;
						break;

					case 'boolean':
						query += `, '${(document.getElementById(id) as HTMLInputElement).checked}'`;
						break;
				};
			}

			query += `);`;
			console.log(query);

			try {
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
			}
			catch (error: any)
			{
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}
	else if (main.aux.action == 'm')
	{
		// Get current entry info
		let entry = (await main.querySQL(`SELECT * FROM insumo WHERE id_insumo = ${main.aux.id};`)).rows[0];

		// Fill inputs
		for (let i = 1; i < column.length; i++) {
				
			let id: string = `input_${column[i].name}`;

			switch (column[i].type) {

				case 'integer': case 'bigint': case 'text':
					(document.getElementById(id) as HTMLInputElement).value = entry[column[i].name];
					break;

				case 'boolean':
					(document.getElementById(id) as HTMLInputElement).checked = entry[column[i].name];
					break;
			};
		}
		
		// Accept button
		let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
		button_accept.addEventListener('click', async (): Promise<void> => {

			let query: string = `UPDATE insumo SET `;
			for (let i = 1; i < column.length; i++) {
				
				let id: string = `input_${column[i].name}`;

				switch (column[i].type) {

					case 'integer': case 'bigint': case 'text':
						query += `${column[i].name} = '${(document.getElementById(id) as HTMLInputElement).value}', `;
						break;

					case 'boolean':
						query += `${column[i].name} = '${(document.getElementById(id) as HTMLInputElement).checked}', `;
						break;
				};
			}

			query = query.slice(0, -2);
			query += ` WHERE id_insumo = ${main.aux.id};`;
			console.log(query);

			try {
				await main.querySQL(query);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
			}
			catch (error: any)
			{
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});

	}

	// Button add supplier
	
	button_add_supplier.addEventListener('click', async (): Promise<void> => 
	{
		
		let tempFunc = async (): Promise<void> => {
			
			addNewSupplierInputs();
		};
		await tempFunc();
	});

}
MAIN();

function addNewSupplierInputs() {

	let inputContainer = document.createElement('div') as HTMLDivElement;
	let id: string = `id_supp_${id_supp}`;
	inputContainer.id = id;
	id_supp++;

	// Supplier name
	let supplierID = document.createElement('span') as HTMLSpanElement;
	supplierID.style.display = 'block';
	supplierID.className = 'id';
	supplierID.innerHTML = 'NONE';
	inputContainer.appendChild(supplierID);
	
	// Supplier name
	let supplierName = document.createElement('span') as HTMLSpanElement;
	supplierName.style.display = 'block';
	supplierName.className = 'name';
	supplierName.innerHTML = 'NONE';
	inputContainer.appendChild(supplierName);

	// Remove button
	let buttonRemove = document.createElement('button') as HTMLButtonElement;
	buttonRemove.innerHTML = 'Eliminar';
	buttonRemove.addEventListener('click', (event: any): void => {

		// Delete from DOM
		event.target.parentElement.remove()
	});
	inputContainer.appendChild(buttonRemove);

	// Append to form
	form_suppliers.appendChild(inputContainer);

	// Set aux target
	main.setProperty({...main.aux, column: 'proveedor', target: id}, 'aux');

	// Create query window
	let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

	// Code to set 'id' and 'supplier name' at close window
	let code: string =
	`
	try
	{
		const remote_1 = require("@electron/remote");
		const main = (0, remote_1.getGlobal)('main');
		document.getElementById('${id}').querySelector('.id').innerHTML = main.aux.return;
		document.getElementById('${id}').querySelector('.name').innerHTML = main.aux.returnName;
	}
	catch (error)
	{
		document.getElementById('${id}').querySelector('.id').innerHTML = main.aux.return;
		document.getElementById('${id}').querySelector('.span').innerHTML = main.aux.returnName;
	}
	`;
	
	queryWindow.setVar(code, 'codeCloseParent');
}

