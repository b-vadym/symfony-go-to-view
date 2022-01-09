'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    Position,
    Range,
    workspace
} from "vscode";
import * as util from '../utils';

export default class LinkProvider implements vsDocumentLinkProvider {
    public async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        const quickJump = workspace.getConfiguration('symfony-go-to-view.quickJump');

        if (!quickJump) {
            return [];
        }

        const reg = /['"](?<template>[^"']+\.twig)['"]/;
        const documentLinks = [];

        for (let index = 0; index < doc.lineCount; index++) {
            const line = doc.lineAt(index);
            const result = line.text.match(reg);
            const item = result?.groups?.template;

            if (item === null || item === undefined) {
                continue;
            }

            const file = await util.getFilePath(item, doc);

            if (file === null) {
                continue;
            }

            const start = new Position(line.lineNumber, line.text.indexOf(item));
            const end = start.translate(0, item.length);
            const documentLink = new DocumentLink(new Range(start, end), file);
            documentLinks.push(documentLink);
        }

        return documentLinks;
    }
}
