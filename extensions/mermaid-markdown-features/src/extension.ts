/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { configSection, injectMermaidConfig } from './markdownMermaid/config';
import { extendMarkdownItWithMermaid } from './markdownMermaid/markdownIt';
import type MarkdownIt from 'markdown-it';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration(`${configSection}.languages`)) {
			void vscode.commands.executeCommand('markdown.api.reloadPlugins');
		}
		if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
			void vscode.commands.executeCommand('markdown.preview.refresh');
		}
	}));

	return {
		extendMarkdownIt(md: MarkdownIt) {
			extendMarkdownItWithMermaid(md, {
				languageIds: () => vscode.workspace.getConfiguration(configSection).get<readonly string[]>('languages', ['mermaid'])
			});
			md.use(injectMermaidConfig);
			return md;
		}
	};
}
