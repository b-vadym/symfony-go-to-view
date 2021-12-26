'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    Position,
    Range
} from "vscode";
import * as util from '../utils';

export default class LinkProvider implements vsDocumentLinkProvider {
    public provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];

        let reg = /['"](?<template>[^"']+\.twig)['"]/;

        for (let index = 0; index < doc.lineCount; index++) {
            let line = doc.lineAt(index);
            let result = line.text.match(reg);
            let item = result?.groups?.template;

            if (item === null|| item === undefined) {
                continue;
            }

            let file = util.getFilePath(item, doc);

            if (file === null) {
                continue;
            }

            let start = new Position(line.lineNumber, line.text.indexOf(item));
            let end = start.translate(0, item.length);
            let documentLink = new DocumentLink(new Range(start, end), file);
            documentLinks.push(documentLink);
        }

        return documentLinks;
    }
}
