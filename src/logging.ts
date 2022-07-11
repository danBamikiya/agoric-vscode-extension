import * as vscode from 'vscode'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface ILogger {
	log(message: string, additionalMessages?: unknown): void
	logAndShowInfoWithActions(
		message: string,
		actions: { prompt: string; action: () => void }[]
	): void
	logDebug(message: string, additionalMessages?: unknown): void
	logAndShowDebug(message: string, additionalMessages?: unknown): void
	logWarning(message: string, additionalMessages?: unknown): void
	logAndShowWarning(message: string, additionalMessages?: unknown): void
	logError(message: string, additionalMessages?: unknown): void
	logAndShowError(message: string, additionalMessages?: unknown): void
	showLogPanel(preserveFocus?: boolean): void
}

export class LoggingService implements ILogger {
	public minimumLogLevel: LogLevel = 'INFO'

	public setOutputLevel(logLevel: LogLevel) {
		this.minimumLogLevel = logLevel
	}

	private commands: vscode.Disposable[]
	private outputChannel: vscode.OutputChannel

	constructor() {
		this.outputChannel = vscode.window.createOutputChannel('Agoric')

		this.commands = [
			vscode.commands.registerCommand('agoric.showLogs', () => {
				this.showLogPanel()
			})
		]
	}

	public dispose() {
		this.commands.forEach(command => command.dispose())
		this.outputChannel.dispose()
	}

	public logAtLevel(
		logLevel: LogLevel,
		message: string,
		additionalMessages?: unknown
	) {
		this.writeLine(message, logLevel)

		if (Array.isArray(additionalMessages)) {
			additionalMessages.forEach(line => {
				this.writeLine(line, logLevel)
			})
		}

		if (additionalMessages instanceof Error) {
			if (additionalMessages?.message) {
				this.writeLine(additionalMessages.message, 'ERROR')
			}
			if (additionalMessages?.stack) {
				this.outputChannel.appendLine(additionalMessages.stack)
			}
		}

		if (typeof additionalMessages === 'object' && additionalMessages !== null) {
			this.logObject(additionalMessages)
		}
	}

	public log(message: string, additionalMessages?: unknown): void {
		this.logAtLevel(this.minimumLogLevel, message, additionalMessages)
	}

	public async logAndShowInfoWithActions(
		message: string,
		actions: { prompt: string; action: () => void }[]
	) {
		this.log(message)

		const fullActions = [
			...actions,
			{
				prompt: 'Show Logs',
				action: () => {
					this.showLogPanel()
				}
			}
		]

		const actionKeys: string[] = fullActions.map(action => action.prompt)

		const choice = await vscode.window.showInformationMessage(
			message,
			...actionKeys
		)
		if (choice) {
			for (const action of fullActions) {
				if (choice === action.prompt) {
					action.action()
					return
				}
			}
		}
	}

	public logDebug(message: string, additionalMessages?: unknown): void {
		this.logAtLevel('DEBUG', message, additionalMessages)
	}

	public logAndShowDebug(message: string, additionalMessages?: unknown): void {
		this.logDebug(message, additionalMessages)

		vscode.window
			.showInformationMessage(message, 'Show Logs')
			.then(selection => {
				if (selection !== undefined) {
					this.showLogPanel()
				}
			})
	}

	public logWarning(message: string, additionalMessages?: unknown): void {
		this.logAtLevel('WARN', message, additionalMessages)
	}

	public logAndShowWarning(
		message: string,
		additionalMessages?: unknown
	): void {
		this.logWarning(message, additionalMessages)

		vscode.window.showWarningMessage(message, 'Show Logs').then(selection => {
			if (selection !== undefined) {
				this.showLogPanel()
			}
		})
	}

	public logError(message: string, additionalMessages?: unknown) {
		this.logAtLevel('ERROR', message, additionalMessages)
	}

	public logAndShowError(message: string, additionalMessages?: unknown) {
		this.logError(message, additionalMessages)

		vscode.window.showErrorMessage(message, 'Show Logs').then(selection => {
			if (selection !== undefined) {
				this.showLogPanel()
			}
		})
	}

	public async logAndShowErrorWithActions(
		message: string,
		actions: { prompt: string; action: () => Promise<void> }[]
	) {
		this.logError(message)

		const fullActions = [
			...actions,
			{
				prompt: 'Show Logs',
				action: async () => {
					this.showLogPanel()
				}
			}
		]

		const actionKeys: string[] = fullActions.map(action => action.prompt)

		const choice = await vscode.window.showErrorMessage(message, ...actionKeys)
		if (choice) {
			for (const action of fullActions) {
				if (choice === action.prompt) {
					await action.action()
					return
				}
			}
		}
	}

	public showLogPanel(preserveFocus?: boolean) {
		this.outputChannel.show(preserveFocus)
	}

	private logObject(data: unknown): void {
		const message = JSON.stringify(data, null, 2)

		this.outputChannel.appendLine(message)
	}

	private writeLine(message: string, level: LogLevel = 'INFO') {
		const now = new Date()
		const timestampedMessage = `${now.toLocaleDateString()} ${now.toLocaleTimeString()} [${level.toUpperCase()}] - ${message}`

		this.outputChannel.appendLine(timestampedMessage)
	}
}
