import * as assert from 'assert';
import { before } from 'mocha';
import { setTimeout } from 'timers';

import * as vscode from 'vscode';

suite('Link Orivider Test Suite', function () {
    this.timeout(5500);

    before(function (done) {
        setTimeout(done, 5000);
    });

    test('Has link in php code', async () => {
        const document = await getFileByName('src/Controller/HomePageController.php');
        const documentLinks = await vscode.commands.executeCommand<vscode.DocumentLink[]>(
            'vscode.executeLinkProvider',
            document.uri,
        );

        assert.strictEqual(1, documentLinks.length);
        const link = documentLinks[0];
        assert.strictEqual(getWorkspaceFolder() + '/templates/homepage.html.twig', link.target?.path);
        assert.deepStrictEqual(new vscode.Range(
            new vscode.Position(15, 30),
            new vscode.Position(15, 48)
        ), link.range);
    });

    test('Has link in twig code', async () => {
        const document = await getFileByName('templates/homepage.html.twig');
        const documentLinks = await vscode.commands.executeCommand<vscode.DocumentLink[]>(
            'vscode.executeLinkProvider',
            document.uri,
        );

        assert.strictEqual(1, documentLinks.length);
        const link = documentLinks[0];
        assert.strictEqual(getWorkspaceFolder() + '/templates/base.html.twig', link.target?.path);
        assert.deepStrictEqual(new vscode.Range(
            new vscode.Position(0, 12),
            new vscode.Position(0, 26)
        ), link.range);
    });
});

async function getFileByName(name: string): Promise<vscode.TextDocument> {
    const files = await vscode.workspace.findFiles(name);

    if (files.length === 0) {
        throw new Error(`File ${name} not found`);
    }

    return vscode.workspace.openTextDocument(files[0]);
}

function getWorkspaceFolder(): string {
    const folders = vscode.workspace.workspaceFolders;

    if (!folders || folders.length === 0) {
        throw new Error('Workspace folder is not defined');
    }

    return folders[0].uri.path;
}
