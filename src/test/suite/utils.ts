import * as path from 'path'
import * as vscode from 'vscode'

const rootPath = path.resolve(__dirname, '../../../../')
const packageJSON = require(path.resolve(rootPath, 'package.json'))
export const extensionId = `${packageJSON.publisher}.${packageJSON.name}`

export async function ensureExtensionIsActivated(): Promise<
	vscode.Extension<any> | undefined
> {
	const extension = vscode.extensions.getExtension(extensionId)
	if (!extension?.isActive) {
		await extension?.activate()
	}
	return extension
}
