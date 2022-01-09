'use strict';

import * as vscode from 'vscode';
import * as fs from "fs";
import { getAllViews } from '../utils';
import ReferenceParser from '../parser';
import * as phpParser from 'php-parser';

export default class CompletionTemplateProvider implements vscode.CompletionItemProvider {
    private timer: any = null;
    private views: Array<string> = [];
    private watcher: any = null;

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
        const rootAst = referenceParser.parse(document.getText());
        referenceParser.inCall(rootAst, position);
        const treeAst = referenceParser.getCalls();

        const lastAst = treeAst[treeAst.length - 1];

        if (!referenceParser.isString(lastAst)) {
            return [];
        }

        const callAst = treeAst[treeAst.length - 2];

        if (!referenceParser.isCall(callAst)) {
            return [];
        }

        const callWhat = callAst.what;

        if (!referenceParser.isPropertyLookup(callWhat)) {
            return [];
        }

        const callIdentifier = callWhat.offset;

        if (!referenceParser.isIdentifier(callIdentifier)) {
            return [];
        }

        if (callIdentifier.name !== 'render') {
            return [];
        }

        if (!callIdentifier.loc) {
            return [];
        }

        if (callAst.arguments.length < 1) {
            return [];
        }

        const templateArgument = callAst.arguments[0];

        if (!referenceParser.inRanger(templateArgument, position)) {
            return [];
        }

        if (!referenceParser.isString(templateArgument)) {
            return [];
        }

        const callIdentifierLoc = callIdentifier.loc;

        if (!callIdentifierLoc) {
            return [];
        }

        const callPosition = referenceParser.locationToVsCodePosition(callIdentifierLoc.start);


        const executeDefinitionProvider = await vscode.commands.executeCommand<vscode.LocationLink[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            callPosition
        );

        if (!executeDefinitionProvider) {
            return [];
        }

        const location = executeDefinitionProvider[0];

        const definition = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', location.targetUri);

        if (definition.length !== 2) {
            return [];
        }

        if (definition[0].kind !== vscode.SymbolKind.Namespace || definition[0].name !== "Symfony\\Bundle\\FrameworkBundle\\Controller") {
            return [];
        }


        if (definition[1].kind !== vscode.SymbolKind.Class || definition[1].name !== "AbstractController") {
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
