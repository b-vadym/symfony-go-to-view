import * as assert from 'assert';
import { before } from 'mocha';
import { setTimeout } from 'timers';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Completion template provider test suite', function () {
    this.timeout(15500);

    before(function (done) {
        setTimeout(done, 100);
    });

    test('Has link in php code', async () => {
        const document = await getFileByName('src/Controller/HomePageController.php');
        const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            document.uri,
            new vscode.Position(15, 30)
        );

        assert.strictEqual(false, completionList.isIncomplete);

        const expectedCompletions = [
            {
                insertText: 'base.html.twig',
                label: 'base.html.twig',
                sortText: '1base.html.twig',
            },
            {
                insertText: 'homepage.html.twig',
                label: 'homepage.html.twig',
                sortText: '1homepage.html.twig',
            },
        ];
        expectedCompletions.forEach((expectedCompletionItem, key) => {
            const completionItem = completionList.items[key];
            assert.strictEqual(
                expectedCompletionItem.insertText,
                completionItem.insertText,
            );
            assert.strictEqual(
                expectedCompletionItem.label,
                completionItem.label,
            );

            assert.strictEqual(
                expectedCompletionItem.sortText,
                completionItem.sortText,
            );
        });
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
