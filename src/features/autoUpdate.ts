import { spawnCmd } from '../utils'
import { workspace } from 'vscode'
import { ILogger } from '../logging'
import { AgoricTerminal } from '../terminal'

export default function autoUpdate(
	loggingService: ILogger,
	currAgoricVersion: string,
	terminal: AgoricTerminal
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
							terminal.startInstall()
						}
					}
				]
			)
		}
		return
	} else {
		if (isSameVersion) {
			loggingService.log(`Agoric SDK already up to date @${currAgoricVersion}`)
			return
		} else {
			// install again
			terminal.startInstall()
		}
	}
}
