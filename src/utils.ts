const fs = require('fs')
const path = require('path')
const spawnSync = require('cross-spawn').sync
const commandExistsSync = require('command-exists').sync
import { SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
import { window } from 'vscode'
import { ILogger } from './logging'

export function spawnCmd(
	command: string,
	args: string[],
	opts?: SpawnSyncOptions
): SpawnSyncReturns<BufferEncoding> | string | null {
	const result: SpawnSyncReturns<BufferEncoding> = spawnSync(command, args, {
		encoding: 'utf-8',
		...opts
	})

	if (!opts?.stdio) {
		return result.stdout ? result.stdout.trim() : result.stdout
	} else {
		return result
	}
}

export function isPkgInstalled(pkgName: string) {
	if (commandExistsSync(pkgName)) {
		return spawnCmd('agoric', ['--version'])
	} else {
		// check further
		const script = `${process.env.HOME || '/usr/local'}/bin/${pkgName}`
		const pkgCurrVersion = spawnCmd(script, ['--version']) as string | null

		if (pkgCurrVersion) {
			const semverRegex = /\d./g

			if (semverRegex.test(pkgCurrVersion)) {
				return pkgCurrVersion.trim()
			} else {
				return false
			}
		} else {
			return false
		}
	}
}

export function setupAgoric(loggingService: ILogger) {
	const agoricPath = path.resolve('agoric-sdk')

	if (fs.existsSync(agoricPath)) {
		loggingService.log('Deleting previous version of Agoric SDK...')

		fs.rmSync(agoricPath, { recursive: true, force: true })
		loggingService.log('Successfully removed previous sdk.')
	}

	loggingService.log('Installing and setting up agoric-sdk...')

	try {
		const cloneResult = spawnSync(
			'git',
			['clone', 'https://github.com/Agoric/agoric-sdk'],
			{
				encoding: 'utf-8',
				shell: true,
				stdio: 'inherit'
			}
		) as SpawnSyncReturns<BufferEncoding>

		if (cloneResult) {
			if (cloneResult.status === 0 && !cloneResult.stderr) {
				loggingService.log('Cloned Agoric SDK Successfully', cloneResult.stdout)
			} else if (cloneResult.status !== 0 && cloneResult.stderr) {
				loggingService.logAndShowError("Couldn't Clone Agoric SDK", [
					`status: ${cloneResult.status}`,
					cloneResult.stderr
				])
			} else {
				loggingService.logDebug('Agoric SDK Clone Error', cloneResult)
			}
		} else {
			loggingService.logAndShowError("Couldn't Clone Agoric SDK", cloneResult)
		}
	} catch (error: any) {
		loggingService.logAndShowError("Couldn't Clone Agoric SDK", error)
	}

	loggingService.log('Installing dependencies...')

	try {
		const yarnInstallResult = spawnSync('yarn', ['install'], {
			cwd: agoricPath,
			encoding: 'utf-8',
			shell: true,
			stdio: 'inherit'
		}) as SpawnSyncReturns<BufferEncoding>

		if (yarnInstallResult) {
			if (yarnInstallResult.status === 0 && !yarnInstallResult.stderr) {
				loggingService.log(
					'Installed Agoric Dependencies Successfully',
					yarnInstallResult.stdout
				)
			} else if (yarnInstallResult.status !== 0 && yarnInstallResult.stderr) {
				loggingService.logAndShowError("Couldn't Install Agoric Dependencies", [
					`status: ${yarnInstallResult.status}`,
					yarnInstallResult.stderr
				])
			} else {
				loggingService.logDebug(
					'Agoric Dependencies Install Error',
					yarnInstallResult
				)
			}
		} else {
			loggingService.logAndShowError(
				"Couldn't Install Agoric Dependencies",
				yarnInstallResult
			)
		}
	} catch (error: any) {
		loggingService.logAndShowError(
			"Couldn't Install Agoric Dependencies",
			error
		)
	}

	const startTime = new Date().getTime()

	try {
		const yarnBuildResult = spawnSync('yarn', ['build'], {
			cwd: agoricPath,
			encoding: 'utf-8',
			shell: true,
			stdio: 'inherit'
		})

		if (yarnBuildResult) {
			if (yarnBuildResult.status === 0 && !yarnBuildResult.stderr) {
				loggingService.log(
					'Built Agoric SDK Successfully',
					yarnBuildResult.stdout
				)
			} else if (yarnBuildResult.status !== 0 && yarnBuildResult.stderr) {
				loggingService.logAndShowError("Couldn't Build Agoric SDK", [
					`status: ${yarnBuildResult.status}`,
					yarnBuildResult.stderr
				])
			} else {
				loggingService.logDebug('Agoric SDK Build Error', yarnBuildResult)
			}
		} else {
			loggingService.logAndShowError(
				"Couldn't Build Agoric SDK",
				yarnBuildResult
			)
		}
	} catch (error: any) {
		loggingService.logAndShowError("Couldn't Build Agoric SDK", error)
	}

	try {
		const linkCliResult = spawnSync('yarn', ['link-cli', '~/bin/agoric'], {
			cwd: agoricPath,
			encoding: 'utf-8',
			shell: true,
			stdio: 'inherit'
		})

		if (linkCliResult) {
			if (linkCliResult.status === 0 && !linkCliResult.stderr) {
				loggingService.log(
					'Linked Agoric CLI Successfully',
					linkCliResult.stdout
				)
			} else if (linkCliResult.status !== 0 && linkCliResult.stderr) {
				loggingService.logAndShowError("Couldn't Link Agoric CLI", [
					`status: ${linkCliResult.status}`,
					linkCliResult.stderr
				])
			} else {
				loggingService.logDebug('Agoric CLI Linking Error', linkCliResult)
			}
		} else {
			loggingService.logAndShowError("Couldn't Link Agoric CLI", linkCliResult)
		}
	} catch (error: any) {
		loggingService.logAndShowError("Couldn't Link Agoric CLI", error)
	}

	const agoricVersion = isPkgInstalled('agoric') as string | false

	if (agoricVersion) {
		const duration = new Date().getTime() - startTime
		return [
			`Setup completed in ${duration}ms.`,
			`Agoric SDK setup @${agoricVersion}`
		]
	}
	return undefined
}

export function startInstall(loggingService: ILogger) {
	const status = setupAgoric(loggingService)

	if (Array.isArray(status)) {
		loggingService.log(status[0])
		loggingService.log(status[1])
		window.showInformationMessage(status[1])
		return
	} else {
		loggingService.logAndShowWarning('Could not install Agoric')
		return
	}
}
