import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "d2c-sync" is now active!');

    let disposable = vscode.commands.registerCommand('d2c-sync.helloWorld', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folders found');
            return;
        }

        // Get the root path of the workspace
        const rootPath = workspaceFolders[0].uri.fsPath;

        // Define the paths of the two files to compare
        const file1Path = path.join(rootPath, 'file1.css');
        const file2Path = path.join(rootPath, 'file2.css');

        // Compare the two files using the diff editor
        Promise.all([
            vscode.workspace.openTextDocument(file1Path),
            vscode.workspace.openTextDocument(file2Path),
        ]).then(([doc1, doc2]) => {
            vscode.window.showTextDocument(doc1).then(editor1 => {
                vscode.window.showTextDocument(doc2).then(editor2 => {
                    const title = `Comparing ${path.basename(file1Path)} to ${path.basename(file2Path)}`;
                    const opts: vscode.TextDocumentShowOptions = {
                        preserveFocus: false,
                        preview: true,
                        viewColumn: vscode.ViewColumn.Active,
                    };
                    vscode.commands.executeCommand<void>(
                        'vscode.diff',
                        doc1.uri,
                        doc2.uri,
                        title,
                        opts
                    ).then(undefined, err => {
                        console.error(err);
                        vscode.window.showErrorMessage(`Error comparing files: ${err.message}`);
                    });
                });
            });
        }).catch(err => {
            console.error(err);
            vscode.window.showErrorMessage(`Error opening files: ${err.message}`);
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}