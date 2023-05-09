import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let platillos_container = document.getElementById('platillos_container') as HTMLDivElement;
let template_platillo: HTMLDivElement = (document.getElementById('template_platillo') as HTMLTemplateElement).content.querySelector('div');
let template_insumo: HTMLDivElement = (document.getElementById('template_insumo') as HTMLTemplateElement).content.querySelector('div');
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
	while (platillos_container.firstChild)
		platillos_container.removeChild(platillos_container.firstChild);

	let value: string = search_bar.value;
	let isNumber: boolean = !isNaN(parseInt(value));
	
	let platillos = null;
	if (isNumber)
		platillos = (await main.querySQL(`SELECT * FROM PLATILLO WHERE NOT ID_PLATILLO = 0 AND ID_PLATILLO = ${value};`)).rows;
	else if (value == '')
		platillos = (await main.querySQL(`SELECT * FROM PLATILLO WHERE NOT ID_PLATILLO = 0;`)).rows;
	else
		platillos = (await main.querySQL(`SELECT * FROM PLATILLO WHERE NOT ID_PLATILLO = 0 AND LOWER(NOMBRE) LIKE LOWER('%${value}%');`)).rows;


	for (const p of platillos)
	{
		let platillo_instance = document.importNode(template_platillo, true);
		(platillo_instance.querySelector('.id_platillo') as HTMLSpanElement).innerHTML = `${p.id_platillo}`;
		(platillo_instance.querySelector('.nombre') as HTMLSpanElement).innerHTML = `${p.nombre}`;
		(platillo_instance.querySelector('.precio') as HTMLSpanElement).innerHTML = `$${p.precio}`;

		if (p.imagen) {
			(platillo_instance.querySelector('.imagen') as HTMLImageElement).src = URL.createObjectURL(new Blob([p.imagen.buffer], {type: "image/png"}));
		}

		// Para cada insumo
		let insumos_platillo = (await main.querySQL(`SELECT * FROM INSUMO_PLATILLO WHERE FK_PLATILLO = ${p.id_platillo};`)).rows;
		for (const i of insumos_platillo)
		{
			let insumo = (await main.querySQL(`SELECT * FROM INSUMO WHERE ID_INSUMO = ${i.fk_insumo};`)).rows[0];

			let insumo_instance = document.importNode(template_insumo, true);
			(insumo_instance.querySelector('.id_insumo') as HTMLSpanElement).innerHTML = `${i.fk_insumo} - `;
			(insumo_instance.querySelector('.nombre') as HTMLSpanElement).innerHTML = `${insumo.nombre}`;
			(insumo_instance.querySelector('.cantidad') as HTMLSpanElement).innerHTML = `${i.cantidad}`;
			(platillo_instance.querySelector('.insumos') as HTMLDivElement).appendChild(insumo_instance);
		}

		// Agregar al DOM
		platillos_container.appendChild(platillo_instance);
	}
}
