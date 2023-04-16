import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let input_user = document.getElementById('input_user') as HTMLInputElement;
let input_password = document.getElementById('input_password') as HTMLInputElement;
let button_login = document.getElementById('button_login') as HTMLButtonElement;

button_login.addEventListener('click', async (): Promise<void> => {

	try {

		// Check empty inputs
		if ((input_user.value == "") || (input_password.value == "") )
			throw {message: "No puede haber campos vacíos"};

		let user: any = (await main.querySQL(`SELECT * FROM empleado WHERE id_empleado = ${input_user.value} AND NOT id_empleado = 0;`)).rows[0];

		// Check user
		if (!user)
			throw {message: "Usuario no existente"};

		// Check password
		if (user.contrasena != input_password.value)
			throw {message: "La contraseña es incorrecta"};

		// Set credentials
		main.setProperty({idEmployee: parseInt(user.id_empleado), role: user.puesto}, 'credentials');

		// Open menu window and close this window
		main.createWindow(1280, 720, 'gui/menu.html', null);
		getCurrentWindow().close();
	}
	catch (error: any) {
		console.log(error);
		dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
	}
});