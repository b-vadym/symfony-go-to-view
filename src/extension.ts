import * as vscode from 'vscode';
import CompletionTemplateProvider from './provider/completionTemplateProvider';
import LinkProvider from './provider/linkProvider';

export function activate(context: vscode.ExtensionContext) {
    const LANGUAGES = [
        { scheme: 'file', language: 'php' },
    ];
    const TRIGGER_CHARACTERS = "\"'".split("");

    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(LANGUAGES, new CompletionTemplateProvider, ...TRIGGER_CHARACTERS));

    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(['php', 'twig'], new LinkProvider()));
}

export function dactivate() { }
