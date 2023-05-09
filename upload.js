const fs = require("fs");
const {Client} = require("pg");

async function main()
{
	let img =
	[
		"./res/food/f1.jpg",
		"./res/food/f2.jpg",
		"./res/food/f3.jpg",
		"./res/food/f4.jpg",
		"./res/food/f5.jpg",
		"./res/food/f6.jpg",
		"./res/food/f7.jpg",
		"./res/food/f8.jpg",
		"./res/food/f9.jpg",
		"./res/food/f10.jpg",
		"./res/food/f11.jpg",
		"./res/food/f12.jpg"
	];

	let index = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

	let client = new Client
	({
		user: "postgres",
		host: "localhost",
		database: "rest",
		port: 5432
	});
	await client.connect();

	/**/
	let data = null;

	for (let i = 0; i < img.length; i++)
	{
		data = fs.readFileSync(img[i], null).toString("base64");
		await client.query(`UPDATE PLATILLO SET IMAGEN = (DECODE('${data}', 'base64')) WHERE ID_PLATILLO = ${index[i]};`);
	}
	/**/

	await client.end();
}

main();
