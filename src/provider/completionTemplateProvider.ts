'use strict';

import * as vscode from 'vscode';
import * as fs from "fs";
import { getAllViews } from '../utils';
import { ReferenceParser, Reference } from '../parser';

export default class CompletionTemplateProvider implements vscode.CompletionItemProvider {
    private timer: any = null;
    private views: Array<string> = [];
    private watcher: any = null;
    private templateReference: Reference[] = [
        {
            class: "Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController",
            method: "render",
            argumentNumber: 0
        },
        {
            class: "Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController",
            method: "renderView",
            argumentNumber: 0
        },
        {
            class: "Symfony\\Bridge\\Twig\\Mime\\TemplatedEmail",
            method: "htmlTemplate",
            argumentNumber: 0
        },
        {
            class: "Symfony\\Bridge\\Twig\\Mime\\TemplatedEmail",
            method: "htmlTemplate",
            argumentNumber: 0
        },
        {
            class: "Symfony\\Bridge\\Twig\\Mime\\TemplatedEmail",
            method: "textTemplate",
            argumentNumber: 0
        },
        {
            class: "Twig\\Environment",
            method: "render",
            argumentNumber: 0
        },
        {
            class: "Twig\\Environment",
            method: "load",
            argumentNumber: 0
        },
        {
            class: "Twig\\Environment",
            method: "display",
            argumentNumber: 0
        },

    ];
    constructor() {
        this.loadViews();
        if (vscode.workspace.workspaceFolders !== undefined) {
            this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "**/*.twig"));
            this.watcher.onDidCreate((e: vscode.Uri) => this.onChange());
            this.watcher.onDidDelete((e: vscode.Uri) => this.onChange());
        }
    }

    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[]> {
        const referenceParser = new ReferenceParser();

        if (!await referenceParser.isInPositionForCompletion(document, position, this.templateReference)) {
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
