import { spawnCmd } from '../utils'
import { AgoricTerminal } from '../terminal'

export default function autoInstall(termial: AgoricTerminal) {
	// check for installed cli dependencies
	const yarnVersion = spawnCmd('yarn', ['--version']) as string | null
	termial.startInstall({
		yarn: {
			installed: yarnVersion && yarnVersion.length ? true : false,
			cmd: 'npm install --global yarn',
			dependencyName: 'Yarn'
		}
	})
}
