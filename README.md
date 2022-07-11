# Agoric Platform Extension for Visual Studio Code

This extension automates the installation and setup of Agoric SDK for DeFi development in JavaScript.

## Prerequisites

- Node.js LTS (version 14.15.0 or higher)
- Yarn (`npm install -g yarn`)

Platform specific requirements are found on the Agoric SDK [repo](https://github.com/Agoric/agoric-sdk#readme)

## Options

### agoric.autoUpdate

By default, on startup, **Agoric** checks for SDK updates at the NPM registry and updates the version locally.
If want to opt out of this, set the `agoric.autoUpdate` option to false. Eg:

```json
{
  "agoric.autoUpdate": false
}
```

## Keyboard Shortcuts

- <kbd>CTRL/CMD</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> : Checks for SDK updates then installs & setups the new Agoric SDK version.

## Installation

You can install the official release of the Agoric extension by following the steps in the Visual Studio Code documentation. In the Extensions pane, search for "Agoric" extension and install it there.
