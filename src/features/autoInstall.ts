import { SpawnSyncReturns } from 'child_process'
import { ILogger } from '../logging'
import { spawnCmd, startInstall } from '../utils'

export default function autoInstall(loggingService: ILogger) {
	// check for and/or install cli dependencies
	const yarnVersion = spawnCmd('yarn', ['--version']) as string | null
	if (!yarnVersion || !yarnVersion.length) {
		loggingService.logWarning('Yarn not installed. Installing yarn...')

		try {
			const spawnedResult = spawnCmd('npm', ['install', '--global', 'yarn'], {
				stdio: 'inherit'
			}) as SpawnSyncReturns<BufferEncoding>
			if (spawnedResult) {
				if (spawnedResult.status === 0 && !spawnedResult.stderr) {
					loggingService.log(
						'Installed Yarn Successfully',
						spawnedResult.stdout
					)
				} else if (spawnedResult.status !== 0 && spawnedResult.stderr) {
					loggingService.logAndShowError("Couldn't Install Yarn", [
						`status: ${spawnedResult.status}`,
						spawnedResult.stderr
					])
				} else {
					loggingService.logDebug('Yarn Install Error', spawnedResult)
				}
			} else {
				loggingService.logAndShowError("Couldn't Install Yarn", spawnedResult)
			}
		} catch (error: any) {
			loggingService.logAndShowError("Couldn't Install Yarn", error)
		}
	}

	startInstall(loggingService)
}
