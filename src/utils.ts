'use strict';

import { workspace, TextDocument, Uri, ExtensionContext, WorkspaceConfiguration } from 'vscode';
import * as fs from "fs";
import * as path from "path";

export function getFilePath(name: string, document: TextDocument): Uri|null {
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
    let filePath = path.join(workspaceFolder, 'templates' ,name);

    try {
        if (fs.statSync(filePath)) {
            return Uri.file(filePath);
        }
    } catch(err) {
        console.error(err);
    }

    return null;
}
