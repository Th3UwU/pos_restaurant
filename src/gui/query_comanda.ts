import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let comandas_container = document.getElementById('comandas_container') as HTMLDivElement;
let template_comanda: HTMLDivElement = (document.getElementById('template_comanda') as HTMLTemplateElement).content.querySelector('div');
let template_platillo: HTMLDivElement = (document.getElementById('template_platillo') as HTMLTemplateElement).content.querySelector('div');
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
		comandas = (await main.querySQL(`SELECT * FROM COMANDA WHERE NOT ID_COMANDA = 0 AND NOT ESTATUS = 'g' AND ID_COMANDA = ${value};`)).rows;
	else if (value == '')
		comandas = (await main.querySQL(`SELECT * FROM COMANDA WHERE NOT ID_COMANDA = 0 AND NOT ESTATUS = 'g';`)).rows;
	else
		comandas = (await main.querySQL(`SELECT * FROM COMANDA WHERE NOT ID_COMANDA = 0 AND NOT ESTATUS = 'g' AND LOWER(NOMBRE_CLIENTE) LIKE LOWER('%${value}%');`)).rows;


	for (const c of comandas)
	{
		let comanda_instance = document.importNode(template_comanda, true);
		(comanda_instance.querySelector('.id_comanda') as HTMLSpanElement).innerHTML = `ID: ${c.id_comanda}`;
		(comanda_instance.querySelector('.fecha') as HTMLSpanElement).innerHTML = `Fecha: ${(c.fecha as Date).toISOString().substring(0, 10)}`;
		(comanda_instance.querySelector('.cliente') as HTMLSpanElement).innerHTML = `Cliente: ${c.nombre_cliente}`;
		(comanda_instance.querySelector('.estatus') as HTMLSpanElement).innerHTML = `Estatus: ${c.estatus}`;

		// Es comanda telefonica
		if (c.hora_entrega)
		{
			(comanda_instance.querySelector('.hora_entrega') as HTMLSpanElement).innerHTML = `Hora entrega: ${c.hora_entrega}`;

			// Si ya se le asigno un repartidor
			if (c.fk_empleado != 0)
				(comanda_instance.querySelector('.empleado') as HTMLSpanElement).innerHTML =
				`Empleado: ${c.fk_empleado} - ${(await main.querySQL(`SELECT NOMBRE FROM EMPLEADO WHERE ID_EMPLEADO = ${c.fk_empleado};`)).rows[0].nombre}`;

			(comanda_instance.querySelector('.local') as HTMLSpanElement).innerHTML = `Local: ${c.local}`;
			(comanda_instance.querySelector('.plaza') as HTMLSpanElement).innerHTML = `Plaza: ${c.plaza}`;
			(comanda_instance.querySelector('.piso') as HTMLSpanElement).innerHTML = `Piso: ${c.piso}`;
			(comanda_instance.querySelector('.pasillo') as HTMLSpanElement).innerHTML = `Pasillo: ${c.pasillo}`;
		}

		// Para cada platillo
		let platillo_comanda = (await main.querySQL(`SELECT * FROM PLATILLO_COMANDA WHERE FK_COMANDA = ${c.id_comanda};`)).rows;
		for (const pc of platillo_comanda)
		{
			let platillo = (await main.querySQL(`SELECT * FROM PLATILLO WHERE ID_PLATILLO = ${pc.fk_platillo};`)).rows[0];

			let platillo_instance = document.importNode(template_platillo, true);
			(platillo_instance.querySelector('.id_platillo') as HTMLSpanElement).innerHTML = `${platillo.id_platillo} - `;
			(platillo_instance.querySelector('.nombre') as HTMLSpanElement).innerHTML = `${platillo.nombre}`;
			(platillo_instance.querySelector('.costo') as HTMLSpanElement).innerHTML = `$${pc.costo} X `;
			(platillo_instance.querySelector('.cantidad') as HTMLSpanElement).innerHTML = `${pc.cantidad}`;

			if (platillo.imagen)
				(platillo_instance.querySelector('.imagen') as HTMLImageElement).src = URL.createObjectURL(new Blob([platillo.imagen.buffer], {type: "image/png"}));

			(comanda_instance.querySelector('.platillos') as HTMLDivElement).appendChild(platillo_instance);
		}


		// Agregar al DOM
		comandas_container.appendChild(comanda_instance);
	}
}
