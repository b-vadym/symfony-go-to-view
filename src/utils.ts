'use strict';

import { workspace, TextDocument, Uri } from 'vscode';
import * as fs from "fs";
import * as path from "path";

export async function getFilePath(name: string, document: TextDocument): Promise<Uri | null> {
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
    let namespace = "(None)";
    let subPath = name;

    if (name.startsWith('@')) {
        const result = name.split(/\/(.*)$/);

        if (!result) {
            return null;
        }

        namespace = result[0];
        subPath = result[1];
    }

    const twigLoaderPaths = workspace.getConfiguration('symfony-go-to-view.loaderPaths');
    const paths = twigLoaderPaths[namespace];

    if (paths === undefined) {
        return null;
    }

    for (let index = 0; index < paths.length; index++) {
        const absolutePath = path.join(workspaceFolder, paths[index], subPath);

        if (await pathExist(absolutePath)) {
            return Uri.file(absolutePath);
        }
    }

    return null;
}

async function pathExist(path: string): Promise<boolean> {
    try {
        if (await fs.promises.stat(path)) {
            return true;
        }
    } catch (err) {
        // console.error(err);
    }

    return false;
}
