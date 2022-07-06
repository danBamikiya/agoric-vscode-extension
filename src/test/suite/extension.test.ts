import { expect } from 'chai'
import { describe, it, before } from 'mocha'
import * as vscode from 'vscode'
import utils = require('./utils')

describe('agoric-vscode extension tests', () => {
	let agoricExtension: vscode.Extension<any> | undefined
	before(async () => {
		vscode.window.showInformationMessage('Starting all tests...')
		agoricExtension = await utils.ensureExtensionIsActivated()
	})

	it('should be present', () => expect(agoricExtension).to.be.ok)

	it('should be activated', () => expect(agoricExtension?.isActive).to.be.true)

	it('should register all agoric commands', async () => {
		const commands = await vscode.commands.getCommands(true)
		const COMMANDS = ['agoric.install']
		const foundAgoricCommands = commands.filter(
			value => COMMANDS.indexOf(value) >= 0 || value.startsWith('agoric.')
		)
		expect(foundAgoricCommands.length).to.deep.equal(COMMANDS.length)
	})

	it('should allow users to turn off auto update', () =>
		expect(vscode.workspace.getConfiguration('agoric').has('autoUpdate')).to.be
			.true)
})
