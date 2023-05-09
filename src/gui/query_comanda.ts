import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let comandas_container = document.getElementById('comandas_container') as HTMLDivElement;
let template_comanda: HTMLDivElement = (document.getElementById('template_comanda') as HTMLTemplateElement).content.querySelector('div');
let search_bar = document.getElementById('search_bar') as HTMLInputElement;

async function MAIN(): Promise<void> {

	await search();

	search_bar.addEventListener('change', async (): Promise<void> => {
		await search();
	});

}
MAIN();

async function search(): Promise<void>
{
	while (comandas_container.firstChild)
		comandas_container.removeChild(comandas_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let comandas = null;
	if (isNumber)
		comandas = (await main.querySQL(`SELECT * FROM COMANDA WHERE NOT ID_COMANDA = 0 AND ID_COMANDA = ${value};`)).rows;
	else if (value == '')
		comandas = (await main.querySQL(`SELECT * FROM COMANDA WHERE NOT ID_COMANDA = 0;`)).rows;


	for (const c of comandas)
	{
		let comanda_instance = document.importNode(template_comanda, true);
		(comanda_instance.querySelector('.id_comanda') as HTMLSpanElement).innerHTML = `${c.id_comanda}`;
		(comanda_instance.querySelector('.fecha') as HTMLSpanElement).innerHTML = `${(c.fecha as Date).toISOString().substring(0, 10)}`;
		(comanda_instance.querySelector('.cliente') as HTMLSpanElement).innerHTML = `${c.nombre_cliente}`;
		(comanda_instance.querySelector('.estatus') as HTMLSpanElement).innerHTML = `Estatus: ${c.estatus}`;

		// Es comanda telefonica
		if (c.hora_entrega)
		{
			(comanda_instance.querySelector('.hora_entrega') as HTMLSpanElement).innerHTML = `${c.hora_entrega}`;

			// Si ya se le asigno un repartidor
			if (c.fk_empleado != 0)
				(comanda_instance.querySelector('.empleado') as HTMLSpanElement).innerHTML =
				`${c.fk_empleado} - ${(await main.querySQL(`SELECT NOMBRE FROM EMPLEADO WHERE ID_EMPLEADO = ${c.fk_empleado};`)).rows[0].nombre}`;

			(comanda_instance.querySelector('.local') as HTMLSpanElement).innerHTML = `${c.local}`;
			(comanda_instance.querySelector('.plaza') as HTMLSpanElement).innerHTML = `${c.plaza}`;
			(comanda_instance.querySelector('.piso') as HTMLSpanElement).innerHTML = `${c.piso}`;
			(comanda_instance.querySelector('.pasillo') as HTMLSpanElement).innerHTML = `${c.pasillo}`;
		}

		// Agregar al DOM
		comandas_container.appendChild(comanda_instance);
	}
}
