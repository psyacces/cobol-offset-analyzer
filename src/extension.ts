import * as vscode from 'vscode';
import { CobolParser } from './cobolParser';

export function activate(context: vscode.ExtensionContext) {
	console.log('COBOL Offset Analyzer is now active!');

	let disposable = vscode.commands.registerCommand('cobol-offset.analyze', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No file is open');
			return;
		}

		const document = editor.document;
		const fileName = document.fileName;

		// Check if it's a COBOL file
		if (!isCobolFile(fileName)) {
			vscode.window.showErrorMessage('This command only works with COBOL files (.cbl, .cob, .cobol)');
			return;
		}

		try {
			// Get all lines from the document
			const lines: string[] = [];
			for (let i = 0; i < document.lineCount; i++) {
				lines.push(document.lineAt(i).text);
			}

			// Parse the COBOL structure
			const parser = new CobolParser();
			const variables = parser.parse(lines);

			if (variables.length === 0) {
				vscode.window.showWarningMessage('No variables found in this COBOL file');
				return;
			}

			// Show success message
			vscode.window.showInformationMessage(`✅ COBOL analysis complete: ${variables.length} variables analyzed. Hover over variables to see offset/length info.`);

		} catch (error) {
			vscode.window.showErrorMessage(`Error analyzing COBOL structure: ${error}`);
		}
	});

	context.subscriptions.push(disposable);

	// Register the hover provider to show offsets
	const hoverProvider = vscode.languages.registerHoverProvider('cobol', {
		provideHover(document: vscode.TextDocument, position: vscode.Position) {
			const lines: string[] = [];
			for (let i = 0; i < document.lineCount; i++) {
				lines.push(document.lineAt(i).text);
			}

			const parser = new CobolParser();
			const variables = parser.parse(lines);

			const hoveredLine = position.line;
			const variable = variables.find(v => v.line === hoveredLine);

			// Show hover for any variable with length info (fields with PIC, groups, or level 01)
			if (variable && variable.length > 0) {
				const posStr = String(variable.position).padStart(6, '0');
				const lenStr = String(variable.length).padStart(6, '0');

				const details: string[] = [];
				details.push(`Position:   ${posStr}`);
				details.push(`Length:     ${lenStr} bytes`);
				details.push(`Type:       ${variable.dataType}`);

				const attributes: string[] = [];
				if (variable.isOccurs) {
					attributes.push(`OCCURS`);
				}
				if (variable.isRedefines) {
					attributes.push(`REDEFINES`);
				}
				if (variable.isSynchronized) {
					attributes.push(`SYNCHRONIZED`);
				}

				if (attributes.length > 0) {
					details.push(`\n*Attributes: ${attributes.join(', ')}*`);
				}

				const hoverText = new vscode.MarkdownString(details.join('\n'));
				hoverText.isTrusted = true;
				return new vscode.Hover(hoverText);
			}

			return null;
		}
	});

	context.subscriptions.push(hoverProvider);
}

function isCobolFile(fileName: string): boolean {
	const cobolExtensions = ['.cbl', '.cob', '.cobol'];
	const lowerName = fileName.toLowerCase();
	return cobolExtensions.some(ext => lowerName.endsWith(ext));
}

export function deactivate() {}
