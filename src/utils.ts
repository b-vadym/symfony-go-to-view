'use strict';

import { workspace, TextDocument, Uri, ExtensionContext, WorkspaceConfiguration } from 'vscode';
import * as fs from "fs";
import * as path from "path";

export function getFilePath(name: string, document: TextDocument): Uri|null {
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
    let filePath = path.join(workspaceFolder, 'templates' ,name);

    if (fs.statSync(filePath)) {
        return Uri.file(filePath);
    }

    return null;
}