const os = require('os')
const fs = require('fs')
const process = require('process')
const spawnSync = require('cross-spawn').sync
const commandExistsSync = require('command-exists').sync
import { SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
import * as vscode from 'vscode'

export const isMacOS: boolean = process.platform === 'darwin'
export const isWindows: boolean = process.platform === 'win32'
export const isLinux: boolean = !isMacOS && !isWindows

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
	return false
}

export function installStatus() {
	return isPkgInstalled('agoric') as string | false
}

export function isAgoricInstalled(installDir: string, dirName: string) {
	for (const item of fs.readdirSync(installDir)) {
		if (item === dirName) {
			return true
		} else {
			continue
		}
	}
}

async function checkIfDirectoryExists(directoryPath: string): Promise<boolean> {
	try {
		const stat: vscode.FileStat = await vscode.workspace.fs.stat(
			vscode.Uri.file(directoryPath)
		)
		return stat.type === vscode.FileType.Directory
	} catch (e) {
		return false
	}
}

export async function getInstallDir() {
	let installDir: string | undefined = vscode.workspace
		.getConfiguration('agoric')
		.get('installDir')

	// Only use installDir setting if it exists else use the home directory
	if (installDir === undefined || !(await checkIfDirectoryExists(installDir))) {
		return os.homedir()
	}
	return installDir
}
