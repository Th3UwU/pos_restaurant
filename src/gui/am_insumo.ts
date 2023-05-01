import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let button_add_supplier = document.getElementById('button_add_supplier') as HTMLButtonElement;
let id_supp: number = 0;

let id_insumo = document.getElementById('id_insumo') as HTMLInputElement;

// Form container
let form = document.getElementById('form') as HTMLDivElement;
let form_suppliers = document.getElementById('form_suppliers') as HTMLDivElement;

async function MAIN(): Promise<void> {

	id_insumo.readOnly = true;

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

			case 'date': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'date';
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

				if (main.aux.action == 'a')
					input.disabled = true;

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

		};
	}

	if (main.aux.action == 'a')
	{
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_INSUMO) FROM INSUMO;`)).rows[0].max;
		new_id++;
		id_insumo.value = `${new_id}`;

		// Accept button
		button_accept.addEventListener('click', async (): Promise<void> => {

			// Main query
			let query: string = `INSERT INTO insumo VALUES(${new_id}`;
			for (let i = 1; i < column.length; i++) {
				
				let id: string = `input_${column[i].name}`;

				switch (column[i].type) {

					case 'integer': case 'bigint': case 'text': case 'date':
						query += `, '${(document.getElementById(id) as HTMLInputElement).value}'`;
						break;

					case 'boolean':
						query += `, '${(document.getElementById(id) as HTMLInputElement).checked}'`;
						break;
				};
			}

			query += `);`;
			console.log(query);

			// Details query
			let queryDetail: string[] = [];
			let form_suppliers_elements = form_suppliers.getElementsByClassName('supplier') as HTMLCollectionOf<HTMLDivElement>;
			for (const supp of form_suppliers_elements) {
				queryDetail.push(`INSERT INTO insumo_proveedor VALUES((SELECT MAX(id_insumo_proveedor) FROM insumo_proveedor) + 1, ${(supp.querySelector('.id') as HTMLSpanElement).innerHTML}, ${new_id});`);
			}

			try {
				await main.querySQL(query);
				for (const dq of queryDetail) {
					console.log(dq);
					await main.querySQL(dq);
				}
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
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
		id_insumo.value = `${main.aux.id}`;

		// Get current entry info
		let entry = (await main.querySQL(`SELECT * FROM insumo WHERE id_insumo = ${main.aux.id};`)).rows[0];

		// Fill inputs
		for (let i = 1; i < column.length; i++) {
				
			let id: string = `input_${column[i].name}`;

			switch (column[i].type) {

				case 'integer': case 'bigint': case 'text':
					(document.getElementById(id) as HTMLInputElement).value = entry[column[i].name];
					break;

				case 'date':
					(document.getElementById(id) as HTMLInputElement).value = (entry[column[i].name] as Date).toISOString().substring(0, 10);
					break;

				case 'boolean':
					(document.getElementById(id) as HTMLInputElement).checked = entry[column[i].name];
					break;
			};
		}

		// Get details
		let entryDetails: any[] = (await main.querySQL(`SELECT * FROM insumo_proveedor WHERE fk_insumo = ${main.aux.id};`)).rows;
		for (const ed of entryDetails) {
			let suppName: string = (await main.querySQL(`SELECT * FROM proveedor WHERE id_proveedor = ${ed.fk_proveedor};`)).rows[0].nombre;
			addSupplierInputs(ed.fk_proveedor, suppName, false);
		}
		
		// Accept button
		button_accept.addEventListener('click', async (): Promise<void> => {

			// Main query
			let query: string = `UPDATE insumo SET `;
			for (let i = 1; i < column.length; i++) {
				
				let id: string = `input_${column[i].name}`;

				switch (column[i].type) {

					case 'integer': case 'bigint': case 'text':
						query += `${column[i].name} = '${(document.getElementById(id) as HTMLInputElement).value}', `;
						break;

					case 'date':
						let tempDate: Date = new Date((document.getElementById(id) as HTMLInputElement).value);
						query += `${column[i].name} = '${tempDate.toISOString().substring(0, 10)}', `;
						break;

					case 'boolean':
						query += `${column[i].name} = '${(document.getElementById(id) as HTMLInputElement).checked}', `;
						break;
				};
			}

			query = query.slice(0, -2);
			query += ` WHERE id_insumo = ${main.aux.id};`;
			console.log(query);

			// Details query
			await main.querySQL(`DELETE FROM insumo_proveedor WHERE fk_insumo = ${main.aux.id};`);

			let queryDetail: string[] = [];
			let form_suppliers_elements = form_suppliers.getElementsByClassName('supplier') as HTMLCollectionOf<HTMLDivElement>;
			for (const supp of form_suppliers_elements) {
				queryDetail.push(`INSERT INTO insumo_proveedor VALUES((SELECT MAX(id_insumo_proveedor) FROM insumo_proveedor) + 1, ${(supp.querySelector('.id') as HTMLSpanElement).innerHTML}, ${main.aux.id});`);
			}

			try {
				await main.querySQL(query);
				for (const dq of queryDetail) {
					console.log(dq);
					await main.querySQL(dq);
				}
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Éxito", message: "Modificación exitosa", type: "info"});
				getCurrentWindow().close();
			}
			catch (error: any)
			{
				console.log(error);
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}

	// Button add supplier
	button_add_supplier.addEventListener('click', (): void => {
		addSupplierInputs('DEFAULT', 'DEFAULT', true);
	});

	// Button cancel
	button_cancel.addEventListener('click', (): void => {
		getCurrentWindow().close();
	});
}
MAIN();

function addSupplierInputs(suppID: string, suppName: string, newSupp: boolean) {

	let inputContainer = document.createElement('div') as HTMLDivElement;
	let id: string = `id_supp_${id_supp}`;
	inputContainer.id = id;
	inputContainer.className = 'supplier';
	id_supp++;

	// Supplier id
	let supplierID = document.createElement('span') as HTMLSpanElement;
	supplierID.style.display = 'block';
	supplierID.className = 'id';
	supplierID.innerHTML = suppID;
	inputContainer.appendChild(supplierID);
	
	// Supplier name
	let supplierName = document.createElement('span') as HTMLSpanElement;
	supplierName.style.display = 'block';
	supplierName.className = 'name';
	supplierName.innerHTML = suppName;
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

	if (newSupp)
	{
		// Set aux target
		main.setProperty({...main.aux, column: 'proveedor', canSelect: true}, 'aux');

		// Create query window
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

		// Code to set 'id' and 'supplier name' at close window
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			const main = (0, remote_1.getGlobal)('main');
			document.getElementById('${id}').querySelector('.id').innerHTML = main.aux.return.id_proveedor;
			document.getElementById('${id}').querySelector('.name').innerHTML = main.aux.return.nombre;
		}
		catch (error) {}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	}
}

