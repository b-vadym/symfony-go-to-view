'use strict';

import { workspace, TextDocument, Uri, ExtensionContext, WorkspaceConfiguration, OverviewRulerLane } from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { join } from 'path';

export function getFilePath(name: string, document: TextDocument): Uri | null {
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
    let namespace = "(None)";
    let subPath = name;

    if (name.startsWith('@')) {
        const result = name.split(/\/(.*)$/);
        if(!result) {
            return null;
        }

        namespace = result[0];
        subPath = result[1];
    }

    const twigLoaderPaths = workspace.getConfiguration('symfony_go_to_view.loader_paths');
    const paths = twigLoaderPaths[namespace];

    if (paths === undefined) {
        return null;
    }


    for (let index = 0; index <= paths.length; index++) {
        let absolutePath = path.join(workspaceFolder, paths[index], subPath);

        if (pathExist(absolutePath)) {
            return Uri.file(absolutePath);
        }
    }

    return null;
}

function pathExist(path: string): boolean {
    try {
        if (fs.statSync(path)) {
            return true;
        }
    } catch (err) {
        console.error(err);
    }

    return false;
}
