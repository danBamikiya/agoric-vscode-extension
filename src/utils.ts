const os = require('os')
const fs = require('fs')
const process = require('process')
const spawnSync = require('cross-spawn').sync
const commandExistsSync = require('command-exists').sync
import path = require('path')
import { SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
import * as vscode from 'vscode'
import { ILogger } from './logging'

export const isMacOS: boolean = process.platform === 'darwin'
export const isWindows: boolean = process.platform === 'win32'
export const isLinux: boolean = !isMacOS && !isWindows

export const sdkFolderName = 'agoric-sdk'
export const sdkRepo = 'https://github.com/Agoric/agoric-sdk'
export const defaultSDKRepoBranch = 'community-dev'

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
	} else if (isLinux || isMacOS) {
		// lazilly check further if on Linux or MacOS
		const versionInTemporaryPath = () => {
			// when the `agoric` package exists in a temporary path affecting on the current terminal session
			const script = `${process.env.HOME}/bin/${pkgName}`
			return spawnCmd(script, ['--version']) as string | null
		}
		const versionInPermanentPath = () => {
			// when the `agoric` package exists in permanent path and is available in a global context
			const script = `/usr/local/bin/${pkgName}`
			return spawnCmd(script, ['--version']) as string | null
		}
		const pkgCurrVersion = versionInTemporaryPath() || versionInPermanentPath()

		if (pkgCurrVersion) {
			const semverRegex = /\d./g

			if (semverRegex.test(pkgCurrVersion)) {
				return pkgCurrVersion.trim()
			}
			return false
		}
		return false
	}
	return false
}

export function installStatus() {
	return isPkgInstalled('agoric') as string | false
}

export function isAgoricSDKCloned(sdkCloneDir: string, folderName: string) {
	for (const item of fs.readdirSync(sdkCloneDir)) {
		if (item === folderName) {
			return true
		} else {
			continue
		}
	}
}

export async function checkIfDirectoryExists(
	directoryPath: string
): Promise<boolean> {
	try {
		const stat: vscode.FileStat = await vscode.workspace.fs.stat(
			vscode.Uri.file(directoryPath)
		)
		return stat.type === vscode.FileType.Directory
	} catch (e) {
		return false
	}
}

export async function getSDKCloneDir() {
	let sdkCloneDir: string | undefined = vscode.workspace
		.getConfiguration('agoric')
		.get('installDir')

	// Only use sdkCloneDir setting if it exists else use the home directory
	if (
		sdkCloneDir === undefined ||
		!(await checkIfDirectoryExists(sdkCloneDir))
	) {
		return os.homedir()
	}
	return sdkCloneDir
}

/*
 * Ensures we're in the set (by user or the default one) sdk folder branch we'll be building the cli from
 */
export async function ensureCorrectSDKFolderGitBranch(loggingService: ILogger) {
	const sdkCloneDir = await getSDKCloneDir()
	const agoricSDKClonePath = path.resolve(sdkCloneDir, 'agoric-sdk')
	const sdkRepoBranch = defaultSDKRepoBranch
	try {
		const currentGitBranch = spawnCmd('git', ['branch', '--show-current'], {
			cwd: agoricSDKClonePath
		}) as string | null

		if (currentGitBranch === sdkRepoBranch) {
			return
		} else {
			spawnCmd('git', ['checkout', sdkRepoBranch], {
				cwd: agoricSDKClonePath
			})
			return
		}
	} catch (error: any) {
		loggingService.logAndShowError(
			"Couldn't Ensure The Agoric SDK Branch",
			error
		)
	}
}
