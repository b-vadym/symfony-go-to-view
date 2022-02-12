import * as vscode from 'vscode';
import CompletionTemplateProvider from './provider/completionTemplateProvider';
import LinkProvider from './provider/linkProvider';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'php' }, new CompletionTemplateProvider, ...['"', "'"]));

    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(['php', 'twig', {pattern: '**/*.twig'}], new LinkProvider()));
}

export function dactivate() { }
