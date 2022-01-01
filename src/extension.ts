import * as vscode from 'vscode';
import LinkProvider from './provider/linkProvider';

export function activate(context: vscode.ExtensionContext) {
    const link = vscode.languages.registerDocumentLinkProvider(['php', 'twig'], new LinkProvider());

    context.subscriptions.push(link);
}

export function dactivate() { }
