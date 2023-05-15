import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let idProveedor: number = 0;
let new_id: number = 0;

let insumoInstanceId: number = 0;

let template_proveedor: HTMLDivElement = (document.getElementById('template_proveedor') as HTMLTemplateElement).content.querySelector('div');
let template_insumo: HTMLDivElement = (document.getElementById('template_insumo') as HTMLTemplateElement).content.querySelector('div');

let section_select_proveedor = document.getElementById('section_select_proveedor') as HTMLDivElement;
let section_select_insumos = document.getElementById('section_select_insumos') as HTMLDivElement;
let section_add_insumos = document.getElementById('section_add_insumos') as HTMLDivElement;
let section_show_total = document.getElementById('section_show_total') as HTMLDivElement;


let id_compra = document.getElementById('id_compra') as HTMLInputElement;
let id_proveedor = document.getElementById('id_proveedor') as HTMLInputElement;
let fecha = document.getElementById('fecha') as HTMLInputElement;

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let button_add = document.getElementById('button_add') as HTMLButtonElement;

async function MAIN(): Promise<void> {

	section_select_insumos.style.display = 'none';
	section_show_total.style.display = 'none';

	button_cancel.addEventListener('click', () => {
		getCurrentWindow().close();
	});

	// Popular con los proveedores registrados
	let proveedores = (await main.querySQL(`SELECT * FROM PROVEEDOR WHERE NOT ID_PROVEEDOR = 0;`)).rows;
	for (const p of proveedores) {
		let proveedor_instance = document.importNode(template_proveedor, true);
		proveedor_instance.dataset.idProveedor = p.id_proveedor;
		(proveedor_instance.querySelector('.nombre') as HTMLSpanElement).innerHTML = `${p.nombre}`;

		(proveedor_instance.querySelector('button') as HTMLButtonElement).addEventListener('click', async (): Promise<void> => {

			section_select_proveedor.style.display = 'none';
			section_select_insumos.style.display = 'block';
			idProveedor = parseInt(proveedor_instance.dataset.idProveedor);
			id_proveedor.value = `${idProveedor}`;
		});

		section_select_proveedor.appendChild(proveedor_instance);
	}

	//
	new_id = (await main.querySQL(`SELECT MAX(ID_COMPRA) FROM COMPRA;`)).rows[0].max;
	new_id++;

	id_proveedor.readOnly = true;

	id_compra.value = `${new_id}`;
	id_compra.readOnly = true;

	fecha.valueAsDate = new Date();
	fecha.readOnly = true;

	//
	button_add.addEventListener('click', async (): Promise<void> => {

		let insumo_instance = document.importNode(template_insumo, true);
		let id: string = `insumo_${insumoInstanceId}`;
		insumo_instance.id = id;
		insumoInstanceId++;

		(insumo_instance.querySelector('.cantidad_insumo') as HTMLInputElement).addEventListener('change', () => {
			updateTotal();
		});

		(insumo_instance.querySelector('.costo_insumo') as HTMLInputElement).addEventListener('change', () => {
			updateTotal();
		});

		(insumo_instance.querySelector('.button_delete') as HTMLButtonElement).addEventListener('click', (event: any): void => {
			event.target.parentElement.remove()
			updateTotal();
		});

		(insumo_instance.querySelector('.id_insumo') as HTMLInputElement).addEventListener('change', async (): Promise<void> => {

			let idInsumo: number = parseInt((insumo_instance.querySelector('.id_insumo') as HTMLInputElement).value);
			try
			{
				if (idInsumo == 0)
					throw 'a';

				let insumo_proveedores = (await main.querySQL(`SELECT * FROM INSUMO_PROVEEDOR WHERE FK_INSUMO = ${idInsumo};`)).rows;
				let valid: boolean = false;
				for (const ip of insumo_proveedores) {
					if (ip.fk_proveedor == idProveedor)
						{valid = true; break;}
				}

				if (!valid)
					throw 'a';
	
				let insumo = (await main.querySQL(`SELECT * FROM INSUMO WHERE ID_INSUMO = ${idInsumo};`)).rows;
				(document.getElementById(id).querySelector('.nombre') as HTMLSpanElement).innerHTML = insumo[0].nombre;
				document.getElementById(id).dataset.valid = '1';

				updateTotal();
			}
			catch (error: any)
			{
				(document.getElementById(id).querySelector('.nombre') as HTMLSpanElement).innerHTML = 'Insumo inválido';
				document.getElementById(id).dataset.valid = '0';
			}
		});

		(insumo_instance.querySelector('.button_select') as HTMLButtonElement).addEventListener('click', async (): Promise<void> => {

			// Set aux target
			main.setProperty({...main.aux, column: 'insumo_proveedor', id_proveedor: idProveedor, canSelect: true}, 'aux');
	
			// Create query window
			let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	
			let code: string =
			`
			try
			{
				const remote_1 = require("@electron/remote");
				let main = (0, remote_1.getGlobal)('main');
				document.getElementById('${id}').querySelector('.id_insumo').value = main.aux.return.id_insumo;
				document.getElementById('${id}').querySelector('.nombre').innerHTML = main.aux.return.nombre;
				document.getElementById('${id}').dataset.valid = '1';
			}
			catch (error) {}
			`;
	
			queryWindow.setVar(code, 'codeCloseParent');
		});

		section_add_insumos.appendChild(insumo_instance);
	});

	//
	button_accept.addEventListener('click', async (): Promise<void> => {

		try {

			let insumos = document.getElementsByClassName('insumo') as HTMLCollectionOf<HTMLDivElement>;
			for (const i of insumos) {

				if (i.dataset.valid == '0')
					throw {message: `El insumo con id '${(i.querySelector('.id_insumo') as HTMLOptionElement).value}' no es válido`};
			}

			section_select_insumos.style.display = 'none';
			section_show_total.style.display = 'block';

			// SQL
			await main.querySQL(`INSERT INTO COMPRA VALUES(${new_id}, ${idProveedor}, DEFAULT);`);
			for (const i of insumos) {

				await main.querySQL(`INSERT INTO COMPRA_INSUMOS_PROVEEDOR VALUES((SELECT MAX(ID_COMPRA_INSUMOS_PROVEEDOR) FROM COMPRA_INSUMOS_PROVEEDOR) + 1,
				${new_id}, ${i.dataset.idInsumo}, ${(i.querySelector('.cantidad_insumo') as HTMLInputElement).value}, ${(i.querySelector('.costo_insumo') as HTMLInputElement).value});`);
			}

			dialog.showMessageBoxSync(null, {title: "Éxito", message: `Registro exitoso`, type: "info"});
			getCurrentWindow().close();
		}
		catch (error: any) {
			dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
		}



		
	});

}
MAIN();

function updateTotal()
{
	let total: number = 0;
	let insumos = document.getElementsByClassName('insumo') as HTMLCollectionOf<HTMLDivElement>;
	for (const i of insumos) {

		if (i.dataset.valid != '0')
		{
			total +=
			parseInt((i.querySelector('.cantidad_insumo') as HTMLInputElement).value) *
			parseInt((i.querySelector('.costo_insumo') as HTMLInputElement).value);
		}

	}
	document.getElementById('total').innerHTML = `$${total}`;
}
