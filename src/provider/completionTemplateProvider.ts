'use strict';

import * as vscode from 'vscode';
import * as fs from "fs";
import { getAllViews } from '../utils';

export default class CompletionTemplateProvider implements vscode.CompletionItemProvider {
    private timer: any = null;
    private views: Array<string> = [];
    private watcher: any = null;

    constructor() {
        this.loadViews();
        if (vscode.workspace.workspaceFolders !== undefined) {
            this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "{,**/}{templates}/{*,**/*}"));
            this.watcher.onDidCreate((e: vscode.Uri) => this.onChange());
            this.watcher.onDidDelete((e: vscode.Uri) => this.onChange());
        }
    }

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Array<vscode.CompletionItem> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        if (!linePrefix.includes('render')) {
            return [];
        }

        return this.views.map(path => new vscode.CompletionItem(path, vscode.CompletionItemKind.Constant));
    }

    onChange() {
        var self = this;
        if (self.timer) {
            clearTimeout(self.timer);
        }
        self.timer = setTimeout(function () {
            self.loadViews();
            self.timer = null;
        }, 5000);
    }

    async loadViews() {
        this.views = await getAllViews();
    }
}
