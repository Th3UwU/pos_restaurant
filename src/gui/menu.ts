import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let button_entrega_comanda = document.getElementById('button_entrega_comanda') as HTMLButtonElement;
let button_cobro_comanda = document.getElementById('button_cobro_comanda') as HTMLButtonElement;
let button_registrar_comanda = document.getElementById('button_registrar_comanda') as HTMLButtonElement;
let button_registrar_platillo = document.getElementById('button_registrar_platillo') as HTMLButtonElement;
let button_modificar_platillo = document.getElementById('button_modificar_platillo') as HTMLButtonElement;
let input_modificar_platillo = document.getElementById('input_modificar_platillo') as HTMLInputElement;
let button_select_modificar_platillo = document.getElementById('button_select_modificar_platillo') as HTMLButtonElement;
let button_registrar_proveedor = document.getElementById('button_registrar_proveedor') as HTMLButtonElement;
let button_consultar_proveedor = document.getElementById('button_consultar_proveedor') as HTMLButtonElement;


async function MAIN(): Promise<void> {

	button_entrega_comanda.addEventListener('click', async (): Promise<void> => {

		main.createWindow(800, 600, 'gui/entrega_comanda.html', getCurrentWindow());
	});

	button_cobro_comanda.addEventListener('click', async (): Promise<void> => {

		main.createWindow(800, 600, 'gui/cobro_comanda.html', getCurrentWindow());
	});

	button_registrar_platillo.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'a', column: 'platillo'}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});
	
	button_modificar_platillo.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'm', column: 'platillo', id: input_modificar_platillo.value}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});
	button_select_modificar_platillo.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'platillo', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('input_modificar_platillo').value = main.aux.return;
		}
		catch (error)
		{
			document.getElementById('input_modificar_platillo').value = main.aux.return;
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});

	button_registrar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'a', column: 'proveedor'}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});

	button_consultar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, column: 'proveedor', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});	

}
MAIN();