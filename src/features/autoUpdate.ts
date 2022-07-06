import { spawnCmd, startInstall } from '../utils'
import { window, workspace } from 'vscode'
import { ILogger } from '../logging'

export default function autoUpdate(
	loggingService: ILogger,
	currAgoricVersion: string
) {
	const agoricUpdatedVersion = spawnCmd('npm', [
		'view',
		'agoric',
		'version'
	]) as string | null

	const semverRegex = /\d./g
	const isSameVersion =
		agoricUpdatedVersion &&
		semverRegex.test(agoricUpdatedVersion) &&
		currAgoricVersion === agoricUpdatedVersion

	const autoUpdate: boolean =
		workspace.getConfiguration('agoric').get('autoUpdate') || true

	if (!autoUpdate) {
		if (!isSameVersion) {
			loggingService.logAndShowInfoWithActions(
				`New version of Agoric available @${agoricUpdatedVersion}`,
				[
					{
						prompt: 'Update Agoric',
						action: () => {
							startInstall(loggingService)
						}
					}
				]
			)
		}
		return
	} else {
		if (isSameVersion) {
			loggingService.log(`Agoric SDK up to date @${currAgoricVersion}`)
			return
		} else {
			// install again
			startInstall(loggingService)
		}
	}
}
