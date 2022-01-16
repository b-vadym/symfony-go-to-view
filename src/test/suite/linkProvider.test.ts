import * as assert from 'assert';
import { before } from 'mocha';
import { setTimeout } from 'timers';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Link Provider Test Suite', function () {
    this.timeout(15500);

    before(function (done) {
        setTimeout(done, 10000);
    });

    test('Has link in php code', async () => {
        const document = await getFileByName('src/Controller/HomePageController.php');
        const documentLinks = await vscode.commands.executeCommand<vscode.DocumentLink[]>(
            'vscode.executeLinkProvider',
            document.uri,
        );

        assert.strictEqual(1, documentLinks.length);
        const link = documentLinks[0];
        assert.strictEqual(
            path.join(getWorkspaceFolder(), 'templates/homepage.html.twig'),
            link.target?.path
        );
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
        assert.strictEqual(
            path.join(getWorkspaceFolder(), '/templates/base.html.twig'),
            link.target?.path
        );
        assert.deepStrictEqual(new vscode.Range(
            new vscode.Position(0, 12),
            new vscode.Position(0, 26)
        ), link.range);
    });
});

async function getFileByName(name: string): Promise<vscode.TextDocument> {
    const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(getWorkspaceFolder(), name)));

    const textEditor = await vscode.window.showTextDocument(textDocument);
    await wait(2000);

    return textEditor.document;
}

function getWorkspaceFolder(): string {
    const folders = vscode.workspace.workspaceFolders;

    if (!folders || folders.length === 0) {
        throw new Error('Workspace folder is not defined');
    }

    return folders[0].uri.path;
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), ms));
