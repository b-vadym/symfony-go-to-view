'use strict';

import { workspace, TextDocument, Uri, ExtensionContext, WorkspaceConfiguration, OverviewRulerLane } from 'vscode';
import * as fs from "fs";
import * as path from "path";

export function getFilePath(name: string, document: TextDocument): Uri | null {
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
    let reg = /^@(?<bundle>[^\/]+)\/(?<templatePath>.*)$/;
    let result = reg.exec(name);

    let bundleName = result?.groups?.bundle;
    let bundleTemplatePath = result?.groups?.templatePath;

    if (bundleName && bundleTemplatePath) {
        return getBundleTemplateUri(workspaceFolder, bundleName, bundleTemplatePath);
    }

    let filePath = path.join(workspaceFolder, 'templates', name);

    if (pathExist(filePath)) {
        return Uri.file(filePath);
    }

    return null;
}

function getBundleTemplateUri(workspaceFolder: string, bundleName: string, bundleTemplateName: string): Uri | null {
    let files: (Uri | null)[] = [];
    // override vendor
    const overrideTemplate = path.join(workspaceFolder, 'templates/' + bundleName + 'Bundle', bundleTemplateName);

    if (pathExist(overrideTemplate)) {
        return Uri.file(overrideTemplate);
    }

    // vendor
    const bundleClassName = bundleName + 'Bundle.php';
    const vendorPath = path.join(workspaceFolder, 'vendor');

    if (pathExist(vendorPath)) {
        fs.readdirSync(vendorPath).forEach(element => {
            const vendorBaseDir = path.join(vendorPath, element);

            if (!fs.statSync(vendorBaseDir).isDirectory()) {
                return;
            }

            fs.readdirSync(vendorBaseDir).forEach(element => {
                const packageDir = path.join(vendorBaseDir, element);

                if (!fs.statSync(packageDir).isDirectory()) {
                    return;
                }


                let bundlePathInPackageRoot = path.join(packageDir, bundleClassName);
                let bundlePathInSrcDir = path.join(packageDir, 'src', bundleClassName);

                if (!pathExist(bundlePathInPackageRoot) && !pathExist(bundlePathInSrcDir)) {
                    return;
                }

                let inRootBundleTemplate = path.join(packageDir, 'templates', bundleTemplateName);

                if (pathExist(inRootBundleTemplate)) {
                    files.push(Uri.file(inRootBundleTemplate));
                }

                let inResourceTemplate = path.join(packageDir, 'src/Resources/view', bundleTemplateName);

                if (pathExist(inResourceTemplate)) {
                    files.push(Uri.file(inResourceTemplate));
                }
            });
        });
    }

    return files.length > 0 ? files[0] : null;
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
