import { App, ButtonComponent, Modal, Setting } from 'obsidian';
import { ColorScheme } from './types';
import { on } from 'codemirror';

export class PluginColorSchemeModal extends Modal {
	private readonly scheme: ColorScheme;
	private readonly onSave: (colorScheme: ColorScheme) => void;

	constructor(app: App, onSave: (colorScheme: ColorScheme) => void, scheme?: ColorScheme) {
		super(app);
		this.onSave = onSave;
		this.scheme = scheme ?? ({} as ColorScheme);
	}

	onOpen() {
		this.contentEl.setText('Build your own color scheme');
		const isExistingScheme = Object.keys(this.scheme).length > 0;

		const input = new Setting(this.contentEl).addText(text => {
			if (!isExistingScheme) {
				this.scheme.name = 'My color scheme';
			}

			text.setValue(this.scheme.name).onChange(text => {
				this.scheme.name = text;
			});
		});

		new Setting(this.contentEl).setName('Light theme color').addColorPicker(picker => {
			if (isExistingScheme) {
				picker.setValue(this.scheme.lightThemeColor);
			}

			picker.onChange(color => {
				this.scheme.lightThemeColor = color;
			});
		});

		new Setting(this.contentEl).setName('Dark theme color').addColorPicker(picker => {
			if (isExistingScheme) {
				picker.setValue(this.scheme.darkThemeColor);
			}

			picker.onChange(color => {
				this.scheme.darkThemeColor = color;
			});
		});

		new ButtonComponent(this.contentEl).setButtonText('Save').onClick(() => {
			this.close();
			this.onSave(this.scheme);
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
