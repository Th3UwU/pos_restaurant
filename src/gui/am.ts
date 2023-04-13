import { getCurrentWindow, dialog, BrowserWindow, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron';
import { Main } from '../main';
import { Query } from 'pg';

let main: Main = getGlobal('main');
console.log(main.aux);

type Column = {
	name: string;
	type: string;
};

let column: Column[] = [];

// entries.rows[i][entries.fields[j].name]

async function MAIN(): Promise<void> {

	// Set form title
	(document.getElementById('form_title') as HTMLSpanElement).innerHTML = `${main.aux.column}`;

	// Retrieve column info
	let tableInfo = await main.querySQL(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = '${main.aux.column}';`);
	
	// Create column info array
	for (const c of tableInfo.rows)
		column.push({name: c.column_name, type: c.data_type});

	// Form container
	let form = document.getElementById('form') as HTMLDivElement;

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

			let query: string = `INSERT INTO ${main.aux.column} VALUES((SELECT MAX(id_${main.aux.column}) FROM ${main.aux.column}) + 1`;
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