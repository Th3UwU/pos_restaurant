import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let visibleColumns: string[];
let matchRow: string = '';

switch (main.aux.column) {

	case "empleado":
		visibleColumns = ['id_empleado', 'nombre', 'puesto'];
		matchRow = 'nombre';
		break;

	case "empleado_repartidor":
		visibleColumns = ['id_empleado', 'nombre'];
		matchRow = 'nombre';
		break;

	case "proveedor":
		visibleColumns = ['id_proveedor', 'nombre', 'direccion'];
		matchRow = 'nombre';
		break;

	case "comanda":
		visibleColumns = ['id_comanda', 'nombre_cliente'];
		matchRow = 'nombre_cliente';
		break;
};

async function MAIN(): Promise<void> {

	let search_bar = document.getElementById('search_bar') as HTMLInputElement;
	let query_container = document.getElementById('query_container') as HTMLDivElement;
	let button_search = document.getElementById('button_search') as HTMLButtonElement;

	(document.getElementById('search_bar_label') as HTMLLabelElement).innerHTML = `Buscar ${main.aux.column}:`;

	button_search.addEventListener('click', async (): Promise<void> => {

		// Clear current query results
		query_container.innerHTML = '';

		// ID or Name
		let isNumber: boolean = !isNaN(parseInt(search_bar.value));

		// Query
		let query: string = null;

		if (main.aux.column == 'comanda')
		{
			query = `SELECT * FROM comanda WHERE ` +
			((isNumber) ? (`id_comanda = ${parseInt(search_bar.value)}`) : (`LOWER(${matchRow}) LIKE LOWER('%${search_bar.value}%')`))
			+ ` AND estatus == 'p';`;
			console.log(query);
		}
		else if (main.aux.column == 'empleado_repartidor')
		{
			query = `SELECT * FROM empleado WHERE ` +
			((isNumber) ? (`id_empleado = ${parseInt(search_bar.value)}`) : (`LOWER(${matchRow}) LIKE LOWER('%${search_bar.value}%')`))
			+ ` AND puesto = 'repartidor';`;
			console.log(query);
		}
		else
		{
			query = `SELECT * FROM ${main.aux.column} WHERE ` +
			((isNumber) ? (`id_${main.aux.column} = ${parseInt(search_bar.value)};`) : (`LOWER(${matchRow}) LIKE LOWER('%${search_bar.value}%');`));
			console.log(query);
		}

		let result = (await main.querySQL(query)).rows;

		for (const i of result) {

			let resultContainer = document.createElement('div') as HTMLDivElement;
			
			for (const j of visibleColumns) {

				// Row text
				let row = document.createElement('span') as HTMLSpanElement;
				row.innerHTML = i[j];
				row.style.display = 'block';
				resultContainer.appendChild(row);
			}
			
			// Button
			let button = document.createElement('button') as HTMLButtonElement;
			button.addEventListener('click', (): void => {

				if (main.aux.column == 'proveedor')
				{
					main.setProperty({...main.aux, return: i[`id_${main.aux.column}`], returnName: i['nombre']}, 'aux');
				}
				else if (main.aux.column == 'empleado_repartidor')
				{
					
					main.setProperty({...main.aux, return: i[`id_empleado`], returnName: i['nombre']}, 'aux');
				}
				else
				{
					main.setProperty({...main.aux, return: i[`id_${main.aux.column}`]}, 'aux');
				}

				getCurrentWindow().close();
			});
			button.innerHTML = 'Seleccionar';
			resultContainer.appendChild(button);

			// Append
			query_container.appendChild(resultContainer);
		}
	});

}
MAIN();


