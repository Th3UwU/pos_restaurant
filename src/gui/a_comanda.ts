import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

// Section order data
let id_comanda = document.getElementById('id_comanda') as HTMLInputElement;
let fecha = document.getElementById('fecha') as HTMLInputElement;
let nombre = document.getElementById('nombre') as HTMLInputElement;
let hora = document.getElementById('hora') as HTMLInputElement;

let telefonica = document.getElementById('telefonica') as HTMLInputElement;
let local = document.getElementById('local') as HTMLInputElement;
let plaza = document.getElementById('plaza') as HTMLInputElement;
let piso = document.getElementById('piso') as HTMLInputElement;
let pasillo = document.getElementById('pasillo') as HTMLInputElement;

let button_order_data_continue = document.getElementById('button_order_data_continue') as HTMLButtonElement;
let button_order_data_cancel = document.getElementById('button_order_data_cancel') as HTMLButtonElement;

// Section platillos
let template_platillo: HTMLDivElement = (document.getElementById('template_platillo') as HTMLTemplateElement).content.querySelector('div');

let platillos = document.getElementById('platillos') as HTMLDivElement;

let button_section_platillos_continue = document.getElementById('button_section_platillos_continue') as HTMLButtonElement;
let button_section_platillos_back = document.getElementById('button_section_platillos_back') as HTMLButtonElement;

// Sections
let section_order_data = document.getElementById('section_order_data') as HTMLDivElement;
let section_platillos = document.getElementById('section_platillos') as HTMLDivElement;

// Form container
let order_data = document.getElementById('order_data') as HTMLDivElement;
let order_data_tel = document.getElementById('order_data_tel') as HTMLDivElement;

async function MAIN(): Promise<void> {

	let new_id: number = (await main.querySQL(`SELECT MAX(ID_COMANDA) FROM COMANDA;`)).rows[0].max;
	new_id++;

	section_order_data.style.display = 'block';
	section_platillos.style.display = 'none';

	//***** Seccion datos comanda *****//

	// Readonly values
	id_comanda.readOnly = true;
	id_comanda.valueAsNumber = new_id;

	fecha.readOnly = true;
	fecha.valueAsDate = new Date();

	// Comanda telefonica
	telefonica.addEventListener('change', async (): Promise<void> => {

		if (telefonica.checked)
			order_data_tel.style.display = 'block';
		else
			order_data_tel.style.display = 'none';
	});

	button_order_data_continue.addEventListener('click', () => {
		section_order_data.style.display = 'none';
		section_platillos.style.display = 'block';
	});

	button_order_data_cancel.addEventListener('click', () => {
		getCurrentWindow().close();
	});

	//***** Seccion platillos *****//

	// Agregar cada platillo al menu
	let platillos_info: any[] = (await main.querySQL(`SELECT * FROM PLATILLO WHERE NOT ID_PLATILLO = 0;`)).rows;
	for (const p of platillos_info)
	{
		let platillo_instance = document.importNode(template_platillo, true);
		platillo_instance.dataset.idPlatillo = `${p.id_platillo}`;

		if (p.imagen)
			(platillo_instance.querySelector('.imagen') as HTMLImageElement).src = URL.createObjectURL(new Blob([p.imagen.buffer], {type: "image/png"}));;
		(platillo_instance.querySelector('.nombre') as HTMLSpanElement).innerHTML = p.nombre;
		(platillo_instance.querySelector('.precio') as HTMLSpanElement).innerHTML = `$${p.precio}`;

		(platillo_instance.querySelector('button') as HTMLButtonElement).addEventListener('click', () => {
			(platillo_instance.querySelector('.cantidad') as HTMLInputElement).valueAsNumber++;
		});

		platillos.appendChild(platillo_instance);
	}


	button_section_platillos_continue.addEventListener('click', async (): Promise<void> => {


	});

	button_section_platillos_back.addEventListener('click', () => {
		section_order_data.style.display = 'block';
		section_platillos.style.display = 'none';
	});


}
MAIN();