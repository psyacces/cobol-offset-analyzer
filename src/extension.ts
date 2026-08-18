import * as vscode from 'vscode';
import { CobolParser } from './cobolParser';

let isActive = true;  // Extension starts active by default
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	console.log('COBOL Offset Analyzer is now active!');

	// Load saved state
	isActive = context.globalState.get('cobolOffsetActive', true);

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'cobol-offset.toggle';
	updateStatusBar();
	context.subscriptions.push(statusBarItem);

	// Toggle command
	let toggleDisposable = vscode.commands.registerCommand('cobol-offset.toggle', async () => {
		isActive = !isActive;
		await context.globalState.update('cobolOffsetActive', isActive);
		updateStatusBar();

		if (isActive) {
			vscode.window.showInformationMessage('✅ COBOL Offset Analyzer: ACTIVE');
			// Re-analyze current file if it's COBOL
			const editor = vscode.window.activeTextEditor;
			if (editor && isCobolFile(editor.document.fileName)) {
				analyzeCurrentFile();
			}
		} else {
			vscode.window.showInformationMessage('❌ COBOL Offset Analyzer: INACTIVE');
		}
	});
	context.subscriptions.push(toggleDisposable);

	// Manual analyze command (for backward compatibility)
	let disposable = vscode.commands.registerCommand('cobol-offset.analyze', () => {
		if (!isActive) {
			vscode.window.showWarningMessage('COBOL Offset Analyzer is disabled. Press Ctrl+Shift+O to enable.');
			return;
		}
		analyzeCurrentFile();
	});
	context.subscriptions.push(disposable);

	// Register the hover provider
	const hoverProvider = vscode.languages.registerHoverProvider('cobol', {
		provideHover(document: vscode.TextDocument, position: vscode.Position) {
			if (!isActive) return null;

			const lines: string[] = [];
			for (let i = 0; i < document.lineCount; i++) {
				lines.push(document.lineAt(i).text);
			}

			const parser = new CobolParser();
			const variables = parser.parse(lines);

			const hoveredLine = position.line;
			// A definition can span several lines (e.g. a REDEFINES clause wrapped
			// onto the next line). Match anywhere in the statement, preferring the
			// narrowest match so nested entries never shadow each other.
			const candidates = variables.filter(v => hoveredLine >= v.line && hoveredLine <= v.endLine);
			const variable = candidates.length === 0 ? undefined : candidates.reduce((best, v) =>
				(v.endLine - v.line) < (best.endLine - best.line) ? v : best
			);

			if (variable) {
				const posStr = String(variable.position).padStart(6, '0');
				const lenStr = String(variable.length).padStart(6, '0');

				const details: string[] = [];
				details.push(`Position:   ${posStr}`);
				details.push(`Length:     ${lenStr} bytes`);
				details.push(`Type:       ${variable.dataType}`);

				const attributes: string[] = [];
				if (variable.isOccurs) {
					attributes.push(`OCCURS ${variable.occursCount}`);
				}
				if (variable.isRedefines) {
					attributes.push(`REDEFINES ${variable.redefinesTarget}`.trim());
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

	// Watch for file opens and analyze COBOL files
	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor && isActive && isCobolFile(editor.document.fileName)) {
			// Parser runs automatically on hover, no need to do anything here
		}
	}, null, context.subscriptions);
}

function analyzeCurrentFile(): void {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No file is open');
		return;
	}

	const document = editor.document;
	if (!isCobolFile(document.fileName)) {
		vscode.window.showErrorMessage('This command only works with COBOL files (.cbl, .cob, .cobol)');
		return;
	}

	try {
		const lines: string[] = [];
		for (let i = 0; i < document.lineCount; i++) {
			lines.push(document.lineAt(i).text);
		}

		const parser = new CobolParser();
		const variables = parser.parse(lines);

		if (variables.length === 0) {
			vscode.window.showWarningMessage('No variables found in this COBOL file');
			return;
		}

		vscode.window.showInformationMessage(`✅ COBOL analysis complete: ${variables.length} variables. Hover over variables to see offset/length info.`);
	} catch (error) {
		vscode.window.showErrorMessage(`Error analyzing COBOL structure: ${error}`);
	}
}

function isCobolFile(fileName: string): boolean {
	const cobolExtensions = ['.cbl', '.cob', '.cobol'];
	const lowerName = fileName.toLowerCase();
	return cobolExtensions.some(ext => lowerName.endsWith(ext));
}

function updateStatusBar(): void {
	if (isActive) {
		statusBarItem.text = '$(check) COBOL Offset: ON';
		statusBarItem.tooltip = 'COBOL Offset Analyzer is ACTIVE. Click or press Ctrl+Shift+O to disable.';
		statusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
	} else {
		statusBarItem.text = '$(circle-slash) COBOL Offset: OFF';
		statusBarItem.tooltip = 'COBOL Offset Analyzer is INACTIVE. Click or press Ctrl+Shift+O to enable.';
		statusBarItem.color = new vscode.ThemeColor('errorForeground');
	}
	statusBarItem.show();
}

export function deactivate() {}
