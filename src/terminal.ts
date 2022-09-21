const os = require('os')
const path = require('path')
import vscode = require('vscode')
import { ILogger } from './logging'
import utils = require('./utils')

interface CliDependencies {
	[x: string]: { installed: boolean; cmd: string; dependencyName: string }
}

export class AgoricTerminal {
	public onExited: vscode.Event<void>
	private onExitedEmitter = new vscode.EventEmitter<void>()

	private consoleTerminal: vscode.Terminal | undefined
	private statusReported = false
	private consoleCloseSubscription: vscode.Disposable | undefined
	private consoleChangeSubscription: vscode.Disposable | undefined

	private sdkDirName = 'agoric-sdk'
	private sdkRepo = 'https://github.com/Agoric/agoric-sdk'

	constructor(private title: string, private loggingService: ILogger) {
		this.onExited = this.onExitedEmitter.event
	}

	public async startInstall(cliDependencies?: CliDependencies) {
		const installDir = await utils.getInstallDir()

		const terminalOptions: vscode.TerminalOptions = {
			name: this.title,
			cwd: installDir,
			isTransient: true
		}

		this.consoleTerminal = vscode.window.createTerminal(terminalOptions)
		this.loggingService.log(`Process started.`)
		this.consoleTerminal.show(true)

		// Subscribe a log event for when the termnial closes
		this.loggingService.log('Registering terminal close callback')
		this.consoleCloseSubscription = vscode.window.onDidCloseTerminal(terminal =>
			this.onTerminalClose(terminal)
		)

		// Subscribe a log event for when the terminal goes inactive
		// This is a done to log setup status since the terminal process can't be synced with logging
		this.loggingService.log('Registering terminal change callback')
		this.consoleChangeSubscription = vscode.window.onDidChangeActiveTerminal(
			terminal => this.onTermnialInactive(terminal)
		)

		this.checkCliDependencies(cliDependencies)
		this.setupAgoric(installDir)
	}

	public showConsole(preserveFocus: boolean) {
		if (this.consoleTerminal) {
			this.consoleTerminal.show(preserveFocus)
		}
	}

	public dispose() {
		if (this.consoleCloseSubscription) {
			this.consoleCloseSubscription.dispose()
			this.consoleCloseSubscription = undefined
		}

		if (this.consoleChangeSubscription) {
			this.consoleChangeSubscription.dispose()
			this.consoleChangeSubscription = undefined
		}

		if (this.consoleTerminal) {
			this.loggingService.log('Terminating termnial...')
			this.consoleTerminal.dispose()
			this.consoleTerminal = undefined
		}
	}

	private checkCliDependencies(cliDependencies?: CliDependencies) {
		if (cliDependencies) {
			for (const cliDependency of Object.keys(cliDependencies)) {
				const { installed, cmd, dependencyName } =
					cliDependencies[cliDependency]
				if (installed) {
					return
				} else {
					this.loggingService.logWarning(
						`${dependencyName} not installed. Installing ${dependencyName}...`
					)
					// go on to install the dependency
					this.consoleTerminal?.sendText(cmd)
				}
			}
		}
		return
	}

	private setupAgoric(installDir: string) {
		const agoricInstalled = utils.isAgoricInstalled(installDir, this.sdkDirName)

		if (agoricInstalled) {
			this.clearPrevSetup(installDir)
		}

		this.loggingService.log('Installing and setting up agoric-sdk...')
		this.consoleTerminal?.sendText(`git clone ${this.sdkRepo}`)

		this.consoleTerminal?.sendText(`cd ${this.sdkDirName}`)

		if (utils.isWindows) {
			this.consoleTerminal?.sendText(
				'Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process'
			)
		}

		this.consoleTerminal?.sendText('yarn install')

		this.consoleTerminal?.sendText('yarn build')

		this.consoleTerminal?.sendText('yarn link-cli ~/bin/agoric')

		this.attemptPATHBinding()
	}

	private async clearPrevSetup(installDir: string) {
		this.loggingService.log('Deleting previous version of Agoric SDK...')

		// Remove the agoric-sdk directory made from the previously run `git clone ${sdkRepo}`
		if (utils.isWindows) {
			this.consoleTerminal?.sendText(
				`Remove-Item -R -Force -Path ${installDir}/${this.sdkDirName}`
			)
		}
		if (utils.isLinux || utils.isMacOS) {
			this.consoleTerminal?.sendText(`rm -rf ${installDir}/${this.sdkDirName}`)
		}

		// Remove the command from path made from the previously run `yarn link-cli ~/bin/agoric`
		if (utils.isWindows) {
			const prevDir = `${os.homedir()}\bin\agoric`
			if (await utils.checkIfDirectoryExists(prevDir)) {
				this.consoleTerminal?.sendText(`Remove-Item -R -Force -Path ${prevDir}`)
			}
		}
		if (utils.isLinux || utils.isMacOS) {
			this.consoleTerminal?.sendText(`rm -rf ~/bin/agoric`)
		}

		// Remove any other related path that may obstruct the setup
		if (utils.isWindows) {
			const dir = `${installDir}\bin\agoric`
			if (await utils.checkIfDirectoryExists(dir)) {
				this.consoleTerminal?.sendText(`Remove-Item -R -Force -Path ${dir}`)
			}
		}
		if (utils.isLinux || utils.isMacOS) {
			const dir = `${installDir}/bin/agoric`
			if (await utils.checkIfDirectoryExists(dir)) {
				this.consoleTerminal?.sendText(`rm -rf ${dir}`)
			}
		}
	}

	private attemptPATHBinding() {
		const script = `${os.homedir()}/bin/agoric`
		const bindir = path.dirname(script)

		const PATH = process.env.PATH
		if (!PATH) {
			// Ideally this isn't supposed to log
			this.loggingService.logWarning('$PATH is not set, cannot verify')
		} else {
			// Attempt Windows compatibility.
			const sep = PATH.includes(';') ? ';' : ':'
			if (!PATH.split(sep).includes(bindir)) {
				this.loggingService.logWarning(
					`Script directory ${bindir} does not appear in $PATH. Attempting to add it to your PATH environment variable`
				)

				if (sep === ';') {
					this.consoleTerminal?.sendText(`setx PATH "%PATH%${sep}${bindir}"`)
				} else {
					this.consoleTerminal?.sendText(`export PATH=$PATH${sep}${bindir}`)
				}
			}
		}
	}

	private reportSetupStatus() {
		const agoricVersion = utils.installStatus()
		if (agoricVersion) {
			this.loggingService.log(`Setup completed.`)
			this.loggingService.log(`Agoric SDK setup @${agoricVersion}`)
			vscode.window.showInformationMessage(`Agoric SDK setup @${agoricVersion}`)
			vscode.window.showInformationMessage(
				'Check out the docs https://agoric.com/documentation/'
			)
		} else {
			this.loggingService.logError(
				'Failed to setup SDK: An error occured while setting up the SDK.'
			)
		}
	}

	private onTerminalClose(terminal: vscode.Terminal) {
		if (terminal !== this.consoleTerminal) {
			return
		}

		this.loggingService.log('Terminal UI was closed')
		if (!this.statusReported) {
			this.reportSetupStatus()
			this.statusReported = true
		}
		this.onExitedEmitter.fire()
	}

	private onTermnialInactive(terminal: vscode.Terminal | undefined) {
		if (!terminal || terminal === this.consoleTerminal) {
			return
		}

		this.loggingService.log('Terminal Inactive')
		if (!this.statusReported) {
			this.reportSetupStatus()
			this.statusReported = true
		}
	}
}
