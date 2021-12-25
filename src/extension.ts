// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import LinkProvider from './provider/linkProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "symfony-go-to-twig" is now active!');

    let link = vscode.languages.registerDocumentLinkProvider(['php', 'twig'], new LinkProvider());

    context.subscriptions.push(link);
}

// this method is called when your extension is deactivated
export function dactivate() { }
