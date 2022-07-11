import * as vscode from 'vscode'
import { isPkgInstalled } from './utils'
import autoInstall from './features/autoInstall'
import autoUpdate from './features/autoUpdate'
import { LoggingService } from './logging'

let loggingService: LoggingService

const installAgoric = () => {
	const currAgoricVersion = isPkgInstalled('agoric') as string | false
	if (currAgoricVersion) {
		autoUpdate(loggingService, currAgoricVersion)
	} else {
		autoInstall(loggingService)
	}
}

export function activate(context: vscode.ExtensionContext) {
	loggingService = new LoggingService()
	loggingService.showLogPanel()
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
}
