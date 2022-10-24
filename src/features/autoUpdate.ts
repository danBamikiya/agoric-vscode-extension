import utils = require('../utils')
import { workspace } from 'vscode'
import { ILogger } from '../logging'
import { AgoricTerminal } from '../terminal'
import path = require('path')

export default async function autoUpdate(
	loggingService: ILogger,
	currAgoricVersion: string,
	terminal: AgoricTerminal
) {
	const installDir = await utils.getInstallDir()
	const agoricSDKPath = path.resolve(installDir, 'agoric-sdk')
	await utils.ensureCorrectSDKFolderGitBranch(loggingService)

	const lastLocalAgoricSDKCommit = utils.spawnCmd(
		'git',
		['log', '-1', '--pretty=format:%h'],
		{
			cwd: agoricSDKPath
		}
	)

	utils.spawnCmd('git', ['fetch', 'origin', `${utils.sdkRepoBranch}`], {
		cwd: agoricSDKPath
	})

	const lastRemoteAgoricSDKCommit = utils.spawnCmd(
		'git',
		['log', '-1', `origin/${utils.sdkRepoBranch}`, '--pretty=format:%h'],
		{
			cwd: agoricSDKPath
		}
	)

	const isSameAgoricSDKVersion =
		lastLocalAgoricSDKCommit === lastRemoteAgoricSDKCommit

	if (isSameAgoricSDKVersion) {
		loggingService.log(`Agoric SDK already up to date @${currAgoricVersion}`)
		return
	} else {
		const autoUpdate: boolean =
			workspace.getConfiguration('agoric').get('autoUpdate') || true
		if (!autoUpdate) {
			loggingService.logAndShowInfoWithActions(
				'New version of Agoric available',
				[
					{
						prompt: 'Update Agoric',
						action: () => {
							terminal.startInstall()
						}
					}
				]
			)
		} else {
			// install again
			terminal.startInstall()
		}
		return
	}
}
