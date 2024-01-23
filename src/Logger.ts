import { PluginManifest } from 'obsidian';
import * as console from 'console';

export class Logger {
	private readonly pluginManifest: PluginManifest;

	constructor(pluginManifest: PluginManifest) {
		this.pluginManifest = pluginManifest;
	}

	error(error: string) {
		console.error(`[${this.pluginManifest.name}] ${error}`);
	}

	warn(warning: string) {
		console.warn(`[${this.pluginManifest.name}] ${warning}`);
	}
}
