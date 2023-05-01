import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

// Form container
let form = document.getElementById('form') as HTMLDivElement;

async function MAIN(): Promise<void> {

	// Set form title
	(document.getElementById('form_title') as HTMLSpanElement).innerHTML = `${main.aux.column}`;

	// Retrieve column info
	let column: Column[] = await getColumnInfo(main.aux.column);
	
	// Primary key (ID)
	{		
		let entry_id: number = 0;

		if (main.aux.action == 'a')
		{
			entry_id = (await main.querySQL(`SELECT MAX(id_${main.aux.column}) FROM ${main.aux.column};`)).rows[0].max;
			entry_id++;
		}
		else if (main.aux.action == 'm')
		{
			entry_id = main.aux.id;
		}

		// Container
		let inputContainer = document.createElement('div') as HTMLDivElement;
		let id: string = `input_${column[0].name}`;

		// Input label
		let inputLabel = document.createElement('label') as HTMLLabelElement;
		inputLabel.innerHTML = `${column[0].name}`;
		inputLabel.setAttribute('for', id);
		inputContainer.appendChild(inputLabel);

		// Input
		let input = document.createElement('input') as HTMLInputElement;
		input.type = 'number';
		input.readOnly = true;
		input.id = id;
		input.value = `${entry_id}`;

		inputContainer.appendChild(input);

		// Append to form
		form.appendChild(inputContainer);
	}

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

			case 'integer': case 'bigint': case 'real': {

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

				if (main.aux.action == 'a')
					input.disabled = true;

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

			let query: string = `INSERT INTO ${main.aux.column} VALUES((SELECT MAX(id_${main.aux.column}) FROM ${main.aux.column}) + 1`;
			for (let i = 1; i < column.length; i++) {
				
				let id: string = `input_${column[i].name}`;

				switch (column[i].type) {

					case 'integer': case 'bigint': case 'text': case 'real':
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
		// Get current entry info
		let entry = (await main.querySQL(`SELECT * FROM ${main.aux.column} WHERE id_${main.aux.column} = ${main.aux.id};`)).rows[0];

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

			let query: string = `UPDATE ${main.aux.column} SET `;
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
			query += ` WHERE id_${main.aux.column} = ${main.aux.id};`;
			console.log(query);

			try {
				await main.querySQL(query);
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

}
MAIN();