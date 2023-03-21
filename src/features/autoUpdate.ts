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
	const sdkCloneDir = await utils.getSDKCloneDir()
	const agoricSDKClonePath = path.resolve(sdkCloneDir, 'agoric-sdk')
	const sdkRepoBranch = utils.defaultSDKRepoBranch
	await utils.ensureCorrectSDKFolderGitBranch(loggingService)

	const lastLocalAgoricSDKCommit = utils.spawnCmd(
		'git',
		['log', '-1', '--pretty=format:%h'],
		{
			cwd: agoricSDKClonePath
		}
	)

	utils.spawnCmd('git', ['fetch', 'origin', sdkRepoBranch], {
		cwd: agoricSDKClonePath
	})

	const lastRemoteAgoricSDKCommit = utils.spawnCmd(
		'git',
		['log', '-1', `origin/${sdkRepoBranch}`, '--pretty=format:%h'],
		{
			cwd: agoricSDKClonePath
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
