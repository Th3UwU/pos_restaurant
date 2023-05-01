import { getCurrentWindow, dialog, getGlobal } from '@electron/remote';
import { OpenDialogOptions } from 'electron'
import { readFileSync } from 'fs';
import { Main } from '../main';
import { getColumnInfo, Column } from '../misc';

let main: Main = getGlobal('main');

let form = document.getElementById('form') as HTMLDivElement;
let form_ingredients = document.getElementById('form_ingredients') as HTMLDivElement;

let id_platillo = document.getElementById('id_platillo') as HTMLInputElement;

let button_accept = document.getElementById('button_accept') as HTMLButtonElement;
let button_cancel = document.getElementById('button_cancel') as HTMLButtonElement;
let button_add_ingredient = document.getElementById('button_add_ingredient') as HTMLButtonElement;

const dialogOpenOptions: OpenDialogOptions = {title: 'Elegir imagen', properties: ['openFile']};

button_cancel.addEventListener('click', (): void => {
	getCurrentWindow().close();
});

async function MAIN(): Promise<void> {

	id_platillo.readOnly = true;

	// Retrieve column info
	let column: Column[] = await getColumnInfo('platillo');

	// Create HTML inputs, Ignore the first one (ID)
	for (let i = 1; i < column.length; i++) {

		let inputContainer = document.createElement('div') as HTMLDivElement;
		let id: string = `input_${column[i].name}`;

		// Input label
		let inputLabel = document.createElement('label') as HTMLLabelElement;
		inputLabel.innerHTML = `${column[i].name}`;
		inputLabel.setAttribute('for', id);
		inputContainer.appendChild(inputLabel);

		switch (column[i].type) {

			case 'integer': case 'bigint': case 'real': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'number';
				input.min = '0';
				input.value = '0';
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'text': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'text';
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'date': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'date';
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'boolean': {

				// Input
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'checkbox';
				input.checked = true;
				input.id = id;
				inputContainer.appendChild(input);

				// Append to form
				form.appendChild(inputContainer);
				
			}
			break;

			case 'bytea': {
				
				// Input image path
				let input = document.createElement('input') as HTMLInputElement;
				input.type = 'text';
				input.id = id;
				inputContainer.appendChild(input);

				// Image src
				let image = document.createElement('img') as HTMLImageElement;
				image.style.display = 'none';
				image.id = `image_preview`;

				// Button select image
				let button = document.createElement('button') as HTMLButtonElement;
				button.innerHTML = `Seleccionar imagen`;
				button.addEventListener('click', async (): Promise<void> => {
					
					let dialogResult: string[] = dialog.showOpenDialogSync(getCurrentWindow(), dialogOpenOptions);

					if (dialogResult != undefined)
					{
						input.value = dialogResult[0];
				
						image.src = dialogResult[0];
						image.style.display = 'block';
					}
				});

				inputContainer.appendChild(input);
				inputContainer.appendChild(button);
				inputContainer.appendChild(image);
				form.appendChild(inputContainer);
			}
		};
	}

	if (main.aux.action == 'a')
	{
		let new_id: number = (await main.querySQL(`SELECT MAX(ID_PLATILLO) FROM PLATILLO;`)).rows[0].max;
		new_id++;
		id_platillo.value = `${new_id}`;

		button_accept.addEventListener('click', async (): Promise<void> => {

			try
			{
				let ingredients = document.getElementsByClassName('ingredient') as HTMLCollectionOf<HTMLDivElement>;
				for (const i of ingredients)
					if (i.dataset.valid == '0')
						throw {message: `El insumo seleccionado no es válido`};

				let imageRaw: string = null;
				let input_imagen = (document.getElementById('input_imagen') as HTMLInputElement);
				if (input_imagen.value != "")
					imageRaw = readFileSync(input_imagen.value, null).toString('base64');

				await main.querySQL(`INSERT INTO PLATILLO VALUES(
					${new_id},
					'${(document.getElementById('input_nombre') as HTMLInputElement).value}',
					${(document.getElementById('input_precio') as HTMLInputElement).value},
					'${(document.getElementById('input_descripcion') as HTMLInputElement).value}',
					${((imageRaw) ? (`(DECODE('${imageRaw}', 'base64'))`) : (`DEFAULT`))},
					${(document.getElementById('input_tiempo_preparacion') as HTMLInputElement).value},
					'${(document.getElementById('input_categoria') as HTMLInputElement).value}',
					DEFAULT
					);`);
				
				for (const i of ingredients)
				{
					await main.querySQL(`INSERT INTO INSUMO_PLATILLO VALUES(
						(SELECT MAX(ID_INSUMO_PLATILLO) FROM INSUMO_PLATILLO) + 1,
						${new_id},
						${(i.querySelector('.ingredient_id') as HTMLInputElement).value},
						${(i.querySelector('.ingredient_amount') as HTMLInputElement).value}
					);`);
				}

				dialog.showMessageBoxSync(null, {title: "Éxito", message: "Registro exitoso", type: "info"});
				getCurrentWindow().close();
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}
	else if (main.aux.action == 'm')
	{
		let platillo = (await main.querySQL(`SELECT * FROM PLATILLO WHERE ID_PLATILLO = ${main.aux.id};`)).rows[0];

		// Fill old data
		id_platillo.value = `${platillo.id_platillo}`;
		(document.getElementById('input_nombre') as HTMLInputElement).value = `${platillo.nombre}`;
		(document.getElementById('input_precio') as HTMLInputElement).value = `${platillo.precio}`;
		(document.getElementById('input_descripcion') as HTMLInputElement).value = `${platillo.descripcion}`;

		if (platillo.imagen)
		{
			let image_preview = (document.getElementById('image_preview') as HTMLImageElement);
			image_preview.style.display = 'block';
			image_preview.src = URL.createObjectURL(new Blob([platillo.imagen.buffer], {type: "image/png"}));
		}

		(document.getElementById('input_tiempo_preparacion') as HTMLInputElement).value = `${platillo.tiempo_preparacion}`;
		(document.getElementById('input_categoria') as HTMLInputElement).value = `${platillo.categoria}`;
		(document.getElementById('input_estatus') as HTMLInputElement).checked = platillo.estatus;

		let platillo_insumos = (await main.querySQL(`SELECT * FROM INSUMO_PLATILLO WHERE FK_PLATILLO = ${main.aux.id};`)).rows;
		for (const pi of platillo_insumos)
			await addIngredient(pi.fk_insumo, pi.cantidad);

		// Query DB
		button_accept.addEventListener('click', async (): Promise<void> => {
			try
			{
				let ingredients = document.getElementsByClassName('ingredient') as HTMLCollectionOf<HTMLDivElement>;
				for (const i of ingredients)
					if (i.dataset.valid == '0')
						throw {message: `El insumo seleccionado no es válido`};
	
				let imageRaw: string = null;
				let image = (document.getElementById('input_imagen') as HTMLInputElement);
				if (image.value != "")
					imageRaw = readFileSync(image.value, null).toString('base64');
			
				await main.querySQL(`UPDATE PLATILLO SET
					NOMBRE = '${(document.getElementById('input_nombre') as HTMLInputElement).value}',
					PRECIO = ${(document.getElementById('input_precio') as HTMLInputElement).value},
					DESCRIPCION = '${(document.getElementById('input_descripcion') as HTMLInputElement).value}',
					${((imageRaw) ? (`IMAGEN = (DECODE('${imageRaw}', 'base64')), `) : (``))}
					TIEMPO_PREPARACION = ${(document.getElementById('input_tiempo_preparacion') as HTMLInputElement).value},
					CATEGORIA = '${(document.getElementById('input_categoria') as HTMLInputElement).value}',
					ESTATUS = ${(document.getElementById('input_estatus') as HTMLInputElement).checked}
					WHERE ID_PLATILLO = ${main.aux.id};`);

				await main.querySQL(`DELETE FROM INSUMO_PLATILLO WHERE FK_PLATILLO = ${main.aux.id};`);
				for (const i of ingredients)
				{
					await main.querySQL(`INSERT INTO INSUMO_PLATILLO VALUES(
						(SELECT MAX(ID_INSUMO_PLATILLO) FROM INSUMO_PLATILLO) + 1,
						${main.aux.id},
						${(i.querySelector('.ingredient_id') as HTMLInputElement).value},
						${(i.querySelector('.ingredient_amount') as HTMLInputElement).value}
					);`);
				}
	
				dialog.showMessageBoxSync(null, {title: "Éxito", message: "Modificación exitosa", type: "info"});
				getCurrentWindow().close();
			}
			catch (error: any)
			{
				dialog.showMessageBoxSync(getCurrentWindow(), {title: "Error", message: error.message, type: "error"});
			}
		});
	}
}
MAIN();

let ingredient_id: number = 0;
button_add_ingredient.addEventListener('click', async (): Promise<void> => {

	await addIngredient(0, 1);
});

async function addIngredient(id_insumo: number, cantidad: number): Promise<void>
{
	let id = `ingredient_id_${ingredient_id}`;
	ingredient_id++;

	let ingredientItemContainer = document.createElement('div') as HTMLDivElement;
	ingredientItemContainer.className = 'ingredient';
	ingredientItemContainer.id = `${id}`;
	ingredientItemContainer.dataset.valid = (id_insumo == 0) ? ('0') : ('1');

	let ingredientName = document.createElement('span') as HTMLSpanElement;
	if (id_insumo != 0)
		ingredientName.innerHTML = `${(await main.querySQL(`SELECT NOMBRE FROM INSUMO WHERE ID_INSUMO = ${id_insumo};`)).rows[0].nombre}, ID Insumo`;
	ingredientName.className = 'ingredient_name';
	ingredientItemContainer.appendChild(ingredientName);

	let ingredientID = document.createElement('input') as HTMLInputElement;
	ingredientID.className = 'ingredient_id';
	if (id_insumo != 0)
		ingredientID.value = `${id_insumo}`;
	ingredientID.addEventListener('change', async (): Promise<void> => {

		try
		{
			if (ingredientID.value == '0')
				throw 'a';

			let ingredient = (await main.querySQL(`SELECT * FROM INSUMO WHERE ID_INSUMO = ${ingredientID.value};`)).rows;
			(document.getElementById(id).querySelector('.ingredient_name') as HTMLSpanElement).innerHTML = ingredient[0].nombre + ', ID Insumo';
			document.getElementById(id).dataset.valid = '1';
		}
		catch (error: any)
		{
			(document.getElementById(id).querySelector('.ingredient_name') as HTMLSpanElement).innerHTML = 'Insumo inválido';
			document.getElementById(id).dataset.valid = '0';
		}
	});
	ingredientItemContainer.appendChild(ingredientID);
	
	let ingredientAmountLabel = document.createElement('label') as HTMLLabelElement;
	ingredientAmountLabel.innerHTML = `Cantidad`;
	ingredientAmountLabel.setAttribute('for', id + '_label');
	ingredientItemContainer.appendChild(ingredientAmountLabel);

	let ingredientAmount = document.createElement('input') as HTMLInputElement;
	ingredientAmount.type = 'number';
	ingredientAmount.className = 'ingredient_amount';
	ingredientAmount.id = id + '_label';
	ingredientAmount.min = '1';
	ingredientAmount.value = `${cantidad}`;
	ingredientItemContainer.appendChild(ingredientAmount);

	let ingredientButton = document.createElement('button') as HTMLButtonElement;
	ingredientButton.innerHTML = `Seleccionar ingrediente`;
	ingredientButton.addEventListener('click', async (): Promise<void> => {

		// Set aux target
		main.setProperty({...main.aux, column: 'insumo', canSelect: true}, 'aux');

		// Create query window
		let queryWindow = main.createWindow(800, 600, 'gui/query.html', getCurrentWindow());

		let code: string =
		`
		try
		{
			const remote_1 = require("@electron/remote");
			let main = (0, remote_1.getGlobal)('main');
			document.getElementById('${id}').querySelector('.ingredient_id').value = main.aux.return.id_insumo;
			document.getElementById('${id}').querySelector('.ingredient_name').innerHTML = main.aux.return.nombre + ', ID Insumo';
			document.getElementById('${id}').dataset.valid = '1';
		}
		catch (error) {}
		`;

		queryWindow.setVar(code, 'codeCloseParent');
	});
	ingredientItemContainer.appendChild(ingredientButton);

	form_ingredients.appendChild(ingredientItemContainer);
}
