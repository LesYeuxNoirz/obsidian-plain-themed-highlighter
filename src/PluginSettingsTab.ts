import { App, ButtonComponent, ColorComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import { AppTheme, PlainThemedHighlighterPlugin } from './PlainThemedHighlighterPlugin';
import { ColorScheme } from './types';
import { PluginColorSchemeModal } from './PluginColorSchemeModal';

export class PluginSettingsTab extends PluginSettingTab {
	private readonly plugin: PlainThemedHighlighterPlugin;

	constructor(app: App, plugin: PlainThemedHighlighterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		this.containerEl.empty();
		const { schemes } = this.plugin.settings;

		schemes.forEach(scheme => {
			let colorPicker: ColorComponent;

			const setting = new Setting(this.containerEl)
				.setName(scheme.name)
				.setDesc(this.getSchemeDescription(this.plugin.getCurrentAppTheme()))
				.addColorPicker(picker => {
					picker.setValue(
						this.plugin.getCurrentAppTheme() === AppTheme.LIGHT
							? scheme.lightThemeColor
							: scheme.darkThemeColor
					);
					picker.setDisabled(true);
					colorPicker = picker;
				});

			setting.addToggle(toggle => {
				toggle.setValue(this.plugin.getCurrentAppTheme() === AppTheme.LIGHT).onChange(isLightTheme => {
					setting.setDesc(this.getSchemeDescription(isLightTheme ? AppTheme.LIGHT : AppTheme.DARK));
					colorPicker.setValue(isLightTheme ? scheme.lightThemeColor : scheme.darkThemeColor);
				});
			});

			setting.addButton(button => {
				button
					.setTooltip('Edit color scheme')
					.setIcon('settings')
					.onClick(() => {
						new PluginColorSchemeModal(
							this.app,
							async colorScheme => {
								await this.saveColorScheme(colorScheme);
							},
							scheme
						).open();
					});
			});

			setting.addButton(button => {
				button
					.setTooltip('Delete color scheme')
					.setIcon('trash-2')
					.onClick(async () => {
						const { schemes } = this.plugin.settings;
						schemes.splice(schemes.indexOf(scheme), 1);
						await this.plugin.saveSettings();
						this.display();
						new Notice(`Successfully deleted the scheme "${scheme.name}"`);
					});
			});
		});

		new ButtonComponent(this.containerEl).setButtonText('Add color scheme').onClick(() => {
			new PluginColorSchemeModal(this.app, async colorScheme => {
				await this.saveColorScheme(colorScheme);
			}).open();
		});
	}

	private async saveColorScheme(colorScheme: ColorScheme) {
		const { schemes } = this.plugin.settings;
		let isNewScheme = !schemes.includes(colorScheme);

		if (isNewScheme) {
			this.plugin.settings.schemes.push(colorScheme);
		}

		await this.plugin.saveSettings();
		this.display();

		new Notice(`Successfully ${isNewScheme ? 'created' : 'updated'} the scheme "${colorScheme.name}"`);
	}

	private getSchemeDescription(theme: AppTheme) {
		const themeName = AppTheme[theme];
		return `${themeName.charAt(0) + themeName.slice(1).toLowerCase()} theme`;
	}
}
