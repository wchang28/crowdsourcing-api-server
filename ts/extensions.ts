import * as fs from 'fs';
import * as path from 'path';

export interface ExtensionModule {
    module: string;
    package_json: any;
    README_md?: string;
}

export function getAllExtensionModules(NODE_PATH: string) : ExtensionModule[] {
    let ret: ExtensionModule[] = [];
	let files = fs.readdirSync(NODE_PATH);
	for (let i in files) {
		let module = files[i];
		let filePath = path.resolve(NODE_PATH, module);
		let fstat = fs.statSync(filePath);
		if (fstat.isDirectory()) {
			let packageJSONFilePath = path.resolve(filePath, "package.json");
			let readmeFilePath = path.resolve(filePath, "README.md");
			try {
				fs.accessSync(packageJSONFilePath);
				let s = fs.readFileSync(packageJSONFilePath, 'utf8');
				let package_json = JSON.parse(s);
				let README_md = null;
				try {
					fs.accessSync(readmeFilePath);
					README_md = fs.readFileSync(readmeFilePath, 'utf8');
				} catch(e) {}
				ret.push({module, package_json, README_md});
			} catch (e) {}
		}
	}
	return ret;
}