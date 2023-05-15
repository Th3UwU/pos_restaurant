import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

type InsumosRequeridos = {
	id_insumo: number;
	stock_requerido: number;
	stock_actual: number;
};

let insumosRequeridos: InsumosRequeridos[] = [];

// Section order data
let id_comanda = document.getElementById('id_comanda') as HTMLInputElement;
let fecha = document.getElementById('fecha') as HTMLInputElement;
let nombre = document.getElementById('nombre') as HTMLInputElement;
let hora = document.getElementById('hora') as HTMLInputElement;

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
let section_ticket = document.getElementById('section_ticket') as HTMLDivElement;

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

	button_order_data_continue.addEventListener('click', () => {

		// Check empty inputs
		if (!checkEmptyInputs())
			{dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "No puede haber campos vacíos", type: "error"}); return;}

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

		try {
			await checkInsumos();

			await main.querySQL(`INSERT INTO COMANDA VALUES(${new_id}, 0,
				'${nombre.value}', '${local.value}', '${plaza.value}', '${piso.value}', '${pasillo.value}',
				'${hora.valueAsDate.getHours()}:${hora.valueAsDate.getMinutes()}', DEFAULT, DEFAULT);`);

			// detail
			let platillos_html = document.getElementsByClassName('platillo') as HTMLCollectionOf<HTMLDivElement>;
			for (const p of platillos_html) {

				if ((p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber != 0)
				{
					let costo_unitario: number = (await main.querySQL(`SELECT PRECIO FROM PLATILLO WHERE ID_PLATILLO = ${p.dataset.idPlatillo};`)).rows[0].precio;

					await main.querySQL(`INSERT INTO PLATILLO_COMANDA VALUES(
						(SELECT MAX(ID_PLATILLO_COMANDA) FROM PLATILLO_COMANDA) + 1,
						${p.dataset.idPlatillo},
						${new_id},
						${(p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber},
						${costo_unitario}
						);`);
				}
			}

			// decrease insumo stock
			for (const i of insumosRequeridos)
				await main.querySQL(`UPDATE INSUMO SET
				EXISTENCIAS = ${i.stock_actual - i.stock_requerido}
				WHERE ID_INSUMO = ${i.id_insumo};`);

			dialog.showMessageBoxSync(null, {title: "Éxito", message: "Venta exitosa", type: "info"});
			
			section_ticket.style.display = 'block';
			section_platillos.style.display = 'none';

			let ticket = section_ticket.querySelector('pre');
			let total: number = 0;

			ticket.innerHTML = `Restaurante ALE\n`;
			ticket.innerHTML += `Folio: ${new_id}\n`;
			ticket.innerHTML += `Fecha: ${(new Date()).toISOString().substring(0, 10)}\n`;
			ticket.innerHTML += `CANT				PLATILLO				PRECIO				IMPORTE\n`;
			for (const p of platillos_html)
			{
				if ((p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber != 0)
				{
					let costo = (await main.querySQL(`SELECT PRECIO FROM PLATILLO WHERE ID_PLATILLO = ${p.dataset.idPlatillo};`)).rows[0].precio * (p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber;
					total += costo;

					let nombre_platillo: string = (await main.querySQL(`SELECT NOMBRE FROM PLATILLO WHERE ID_PLATILLO = ${p.dataset.idPlatillo};`)).rows[0].nombre;
					ticket.innerHTML += `${(p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber}`;
					ticket.innerHTML += `				${nombre_platillo}`;
					ticket.innerHTML += `				$${costo}`;
					ticket.innerHTML += `				$${costo * (p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber}\n`;
				}
			}

			ticket.innerHTML += `\nTOTAL: $${total}\n`;

			ticket.innerHTML += `\nLocal: ${local.value}\nPlaza: ${plaza.value}\nPiso: ${piso.value}\nPasillo: ${pasillo.value}\n`;
			ticket.innerHTML += `Hora entrega: ${hora.valueAsDate.getHours()}:${hora.valueAsDate.getMinutes()}\n`;
			ticket.innerHTML += `--- Gracias por su preferencia ---`;


		}
		catch (error: any) {
			console.log(error);
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
		}
	});

	button_section_platillos_back.addEventListener('click', () => {
		section_order_data.style.display = 'block';
		section_platillos.style.display = 'none';
	});


}
MAIN();

async function checkInsumos(): Promise<void> {

	insumosRequeridos = [];
	let platillos_html = document.getElementsByClassName('platillo') as HTMLCollectionOf<HTMLDivElement>;
	for (const p of platillos_html) {
		
		let insumos_platillo = (await main.querySQL(`SELECT * FROM INSUMO_PLATILLO WHERE FK_PLATILLO = ${p.dataset.idPlatillo};`)).rows;
		for (const insumo of insumos_platillo)
		{
			let index: InsumosRequeridos = null;
			for (const i of insumosRequeridos)
				if (i.id_insumo == insumo.fk_insumo)
					{index = i; break;}

			if (index)
				index.stock_requerido += insumo.cantidad * (p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber;

			else
			{
				insumosRequeridos.push({
					id_insumo: insumo.fk_insumo,
					stock_requerido: insumo.cantidad * (p.querySelector('.cantidad') as HTMLInputElement).valueAsNumber,
					stock_actual: (await main.querySQL(`SELECT EXISTENCIAS FROM INSUMO WHERE ID_INSUMO = ${insumo.fk_insumo};`)).rows[0].existencias
				});
			}
			
		}
	}

	for (const i of insumosRequeridos)
	{
		if ((i.stock_actual - i.stock_requerido) < 0)
		{
			let nombre_insumo: string = (await main.querySQL(`SELECT NOMBRE FROM INSUMO WHERE ID_INSUMO = ${i.id_insumo};`)).rows[0].nombre;
			throw {message: `No hay suficientes ${nombre_insumo} para preparar los platillos`};
		}
	}
}

function checkEmptyInputs(): boolean {
	if (nombre.value == '') return false;
	if (!hora.value) return false;
	if (local.valueAsNumber == 0) return false;
	if (piso.valueAsNumber == 0) return false;
	if (plaza.value == '') return false;
	if (pasillo.value == '') return false;

	return true;
}