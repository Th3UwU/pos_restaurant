import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');
let role: string = main.credentials.role;

let button_entrega_comanda = document.getElementById('button_entrega_comanda') as HTMLButtonElement;
let button_cobro_comanda = document.getElementById('button_cobro_comanda') as HTMLButtonElement;
let button_registrar_comanda = document.getElementById('button_registrar_comanda') as HTMLButtonElement;
let button_registrar_platillo = document.getElementById('button_registrar_platillo') as HTMLButtonElement;
let button_modificar_platillo = document.getElementById('button_modificar_platillo') as HTMLButtonElement;
let input_modificar_platillo = document.getElementById('input_modificar_platillo') as HTMLInputElement;
let span_modificar_platillo = document.getElementById('span_modificar_platillo') as HTMLSpanElement;
let button_select_modificar_platillo = document.getElementById('button_select_modificar_platillo') as HTMLButtonElement;
let button_registrar_proveedor = document.getElementById('button_registrar_proveedor') as HTMLButtonElement;
let button_consultar_proveedor = document.getElementById('button_consultar_proveedor') as HTMLButtonElement;
let button_modificar_proveedor = document.getElementById('button_modificar_proveedor') as HTMLButtonElement;
let input_modificar_proveedor = document.getElementById('input_modificar_proveedor') as HTMLInputElement;
let button_select_modificar_proveedor = document.getElementById('button_select_modificar_proveedor') as HTMLButtonElement;
let button_registrar_compra_proveedor = document.getElementById('button_registrar_compra_proveedor') as HTMLButtonElement;
let button_registrar_empleado = document.getElementById('button_registrar_empleado') as HTMLButtonElement;
let button_consultar_empleado = document.getElementById('button_consultar_empleado') as HTMLButtonElement;
let button_modificar_empleado = document.getElementById('button_modificar_empleado') as HTMLButtonElement;
let input_modificar_empleado = document.getElementById('input_modificar_empleado') as HTMLInputElement;
let button_select_modificar_empleado = document.getElementById('button_select_modificar_empleado') as HTMLButtonElement;
let button_registrar_insumo = document.getElementById('button_registrar_insumo') as HTMLButtonElement;
let button_consultar_insumo = document.getElementById('button_consultar_insumo') as HTMLButtonElement;
let button_modificar_insumo = document.getElementById('button_modificar_insumo') as HTMLButtonElement;
let input_modificar_insumo = document.getElementById('input_modificar_insumo') as HTMLInputElement;
let button_select_modificar_insumo = document.getElementById('button_select_modificar_insumo') as HTMLButtonElement;
let button_consultar_platillo = document.getElementById('button_consultar_platillo') as HTMLButtonElement;
let button_consultar_comanda = document.getElementById('button_consultar_comanda') as HTMLButtonElement;


async function MAIN(): Promise<void> {

	// Hide menu (if not 'gerente')
	if (role != 'gerente')
		document.getElementById('menu_gerente').style.display = 'none';

	//
	button_entrega_comanda.addEventListener('click', async (): Promise<void> => {

		main.createWindow(800, 600, 'gui/entrega_comanda.html', getCurrentWindow());
	});

	button_registrar_platillo.addEventListener('click', async (): Promise<void> => {

		main.createWindow(800, 600, 'gui/am_platillo.html', getCurrentWindow());
	});

	button_modificar_platillo.addEventListener('click', async (): Promise<void> => {

		if (input_modificar_platillo.dataset.valid == '0')
			{dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: "Platillo inválido", type: "error"}); return;}
		main.setProperty({...main.aux, action: 'm', id: input_modificar_platillo.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_platillo.html', getCurrentWindow());
	});

	input_modificar_platillo.addEventListener('change', async (): Promise<void> => {

		try
		{
			input_modificar_platillo.dataset.valid = '1';
			span_modificar_platillo.innerHTML = (await main.querySQL(`SELECT NOMBRE FROM PLATILLO WHERE ID_PLATILLO = ${input_modificar_platillo.value};`)).rows[0].nombre;
		}
		catch (error: any)
		{
			input_modificar_platillo.dataset.valid = '0';
			span_modificar_platillo.innerHTML = 'Platillo no encontrado';
		}
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
			document.getElementById('input_modificar_platillo').dataset.valid = '1';
			document.getElementById('input_modificar_platillo').value = main.aux.return.id_platillo;
			document.getElementById('span_modificar_platillo').innerHTML = main.aux.return.nombre;
		}
		catch (error)
		{
			document.getElementById('input_modificar_platillo').dataset.valid = '0';
			document.getElementById('span_modificar_platillo').innerHTML = 'Platillo no encontrado';
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});

	button_cobro_comanda.addEventListener('click', async (): Promise<void> => {

		main.createWindow(800, 600, 'gui/cobro_comanda.html', getCurrentWindow());
	});

	button_registrar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'a', column: 'proveedor'}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});

	button_consultar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, column: 'proveedor', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});

	button_modificar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'm', column: 'proveedor', id: input_modificar_proveedor.value}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});
	button_select_modificar_proveedor.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, column: 'proveedor', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('input_modificar_proveedor').value = main.aux.return;
		}
		catch (error)
		{
			document.getElementById('input_modificar_proveedor').value = main.aux.return;
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});
	
	
	button_registrar_empleado.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'a', column: 'empleado'}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});
	
	button_consultar_empleado.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'empleado', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});

	button_modificar_empleado.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'm', column: 'empleado', id: input_modificar_empleado.value}, 'aux');
		main.createWindow(800, 600, 'gui/am.html', getCurrentWindow());
	});
	button_select_modificar_empleado.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, column: 'empleado', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('input_modificar_empleado').value = main.aux.return;
		}
		catch (error)
		{
			document.getElementById('input_modificar_empleado').value = main.aux.return;
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});
	
	button_registrar_insumo.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, action: 'a'}, 'aux');
		main.createWindow(800, 600, 'gui/am_insumo.html', getCurrentWindow());
	});

	button_consultar_insumo.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'insumo', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});

	button_modificar_insumo.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, action: 'm', id: input_modificar_insumo.value}, 'aux');
		main.createWindow(800, 600, 'gui/am_insumo.html', getCurrentWindow());
	});
	button_select_modificar_insumo.addEventListener('click', async (): Promise<void> => {
		
		main.setProperty({...main.aux, column: 'insumo', canSelect: true}, 'aux');
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
		
		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('input_modificar_insumo').value = main.aux.return;
		}
		catch (error)
		{
			document.getElementById('input_modificar_insumo').value = main.aux.return;
		}
		`;
		
		queryWindow.setVar(code, 'codeCloseParent');
	});

	button_consultar_platillo.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'platillo', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});

	button_consultar_comanda.addEventListener('click', async (): Promise<void> => {

		main.setProperty({...main.aux, column: 'comanda', canSelect: false}, 'aux');
		main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());
	});
}
MAIN();