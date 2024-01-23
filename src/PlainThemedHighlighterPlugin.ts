import { App, Notice, Plugin, PluginManifest, TFile } from 'obsidian';
import { PluginSettingsTab } from './PluginSettingsTab';
import { Logger } from './Logger';
import { ColorScheme } from './types';

interface PluginSettings {
	schemes: Array<ColorScheme>;
}

export enum AppTheme {
	LIGHT,
	DARK
}

export class PlainThemedHighlighterPlugin extends Plugin {
	settings!: PluginSettings;

	private readonly logger: Logger;
	private appTheme: AppTheme;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.logger = new Logger(this.manifest);
		this.appTheme = this.getCurrentAppTheme();

		const interval = (setInterval as Window['setInterval'])(async () => {
			if (this.getCurrentAppTheme() !== this.appTheme) {
				this.appTheme = this.getCurrentAppTheme();
				await this.updateFile(this.app.workspace.getActiveFile());
				new Notice('Successfully updated highlighting colors to the new theme');
			}
		}, 1000);

		this.registerInterval(interval);
	}

	async onload() {
		await this.loadSettings();
		this.updateCommands();

		const { workspace, vault } = this.app;

		workspace.on('file-open', async file => {
			await this.updateFile(file);
		});

		this.addSettingTab(new PluginSettingsTab(this.app, this));
	}

	async loadSettings() {
		try {
			const settings = (await this.loadData()) as PluginSettings;
			this.settings = { schemes: settings?.schemes ?? [] };
		} catch (e) {
			this.logger.error('Failed to load plugin settings');
			throw e;
		}
	}

	async saveSettings() {
		try {
			this.saveData(this.settings);
			this.updateCommands();
		} catch (e) {
			this.logger.error('Failed to save plugin settings');
		}
	}

	getCurrentAppTheme() {
		return this.app.workspace.containerEl.win.activeDocument.body.className.includes('theme-light')
			? AppTheme.LIGHT
			: AppTheme.DARK;
	}

	updateCommands() {
		this.settings.schemes.forEach(scheme => {
			const { name, lightThemeColor, darkThemeColor } = scheme;
			const plugin = this;

			this.addCommand({
				id: `plain-themed-highlighter-apply-${name}`,
				name: `Plain themed highlighter: apply ${name} highlight`,
				editorCallback(editor) {
					const selection = editor.getSelection();
					editor.replaceSelection(
						`<mark class="${plugin.formatSchemeClassName(scheme)}" style="background: ${
							plugin.getCurrentAppTheme() === AppTheme.LIGHT ? lightThemeColor : darkThemeColor
						}">${selection}</mark>`
					);
				}
			});
		});
	}

	private async updateFile(file: TFile | null) {
		if (file) {
			try {
				await this.app.vault.process(file, content => {
					const marks = content.matchAll(/<mark\sclass="([^"]+)"\sstyle="background:\s(#[^"]+)">/gi);
					const { schemes } = this.settings;

					for (const mark of marks) {
						const className = mark[1];
						const background = mark[2];

						if (background && className) {
							const scheme = schemes.find(s => s.name.toLowerCase() === this.formatSchemeName(className));

							if (scheme) {
								const match = mark[0];
								const regexp = new RegExp(match, 'g');

								content = content.replace(
									regexp,
									match.replace(
										/#\w+/,
										this.getCurrentAppTheme() === AppTheme.LIGHT
											? scheme.lightThemeColor
											: scheme.darkThemeColor
									)
								);
							}
						} else {
							this.logger.warn(
								`Failed to match styles in the mark "${mark}" in the file "${file.name}"\nMatched background: "${background}"\nMatched className: "${className}"`
							);
						}
					}

					return content;
				});
			} catch (e) {
				this.logger.error(`Failed to update the file "${file.name}" at the path ${file.path}`);
				throw e;
			}
		} else {
			this.logger.warn('Got a "file-open" event without a file reference');
		}
	}

	private formatSchemeClassName(scheme: ColorScheme) {
		return scheme.name.toLowerCase().split(' ').join('-');
	}

	private formatSchemeName(schemeClassName: string) {
		return schemeClassName.split('-').join(' ');
	}
}
