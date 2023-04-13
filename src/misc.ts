import { getGlobal } from "@electron/remote";
import { Main } from "./main";

let main: Main = getGlobal('main');

type Column = {
	name: string;
	type: string;
};
async function getColumnInfo(column: string): Promise<Column[]> {

	let tableInfo = await main.querySQL(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = '${column}';`);
	let c: Column[] = [];
	for (const i of tableInfo.rows)
		c.push({name: i.column_name, type: i.data_type});
	return c;
}

export { getColumnInfo, Column };
