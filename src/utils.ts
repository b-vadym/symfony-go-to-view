'use strict';

import { workspace, TextDocument, Uri } from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { getAllFiles } from 'get-all-files';

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

export async function getAllViews(): Promise<Array<string>> {
    if (workspace.workspaceFolders === undefined) {
        return [];
    }

    const workspaceFolder = workspace.workspaceFolders[0].uri.fsPath;

    if (workspaceFolder === undefined) {
        return [];
    }

    const allFiles = [];
    const twigLoaderPaths: { [k: string]: Array<string> } = workspace.getConfiguration('symfony-go-to-view.loaderPaths');
    for (const namespace in twigLoaderPaths) {
        const paths = twigLoaderPaths[namespace];
        const prefix = namespace === '(None)' ? '' : namespace;

        if (paths === undefined) {
            continue;
        }

        for (let index = 0; index < paths.length; index++) {
            const subPath = paths[index];

            if (subPath === undefined) {
                break;
            }

            const fullPath = path.join(workspaceFolder, subPath);
            const files = await getAllFiles(fullPath).toArray();
            allFiles.push(files.map(absolutePath => path.join(prefix, absolutePath.replace(fullPath + '/', ''))));
        }
    }

    return [...new Set(Array.prototype.concat(...allFiles))].filter(path => path.endsWith('.twig'));
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
