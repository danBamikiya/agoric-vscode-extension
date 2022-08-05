import * as vscode from 'vscode'
import { isPkgInstalled } from './utils'
import autoInstall from './features/autoInstall'
import autoUpdate from './features/autoUpdate'
import { LoggingService } from './logging'
import { AgoricTerminal } from './terminal'

let loggingService: LoggingService
let terminal: AgoricTerminal

const installAgoric = () => {
	const currAgoricVersion = isPkgInstalled('agoric') as string | false
	if (currAgoricVersion) {
		autoUpdate(loggingService, currAgoricVersion, terminal)
	} else {
		autoInstall(terminal)
	}
}

export function activate(context: vscode.ExtensionContext) {
	loggingService = new LoggingService()
	terminal = new AgoricTerminal('Agoric', loggingService)

	installAgoric()

	context.subscriptions.push(
		vscode.commands.registerCommand('agoric.install', () => {
			installAgoric()
		})
	)
}

export function deactivate() {
	// Dispose of the logger
	loggingService.dispose()
	// Dispose of the termial
	terminal.dispose()
}
