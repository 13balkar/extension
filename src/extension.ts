import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "d2c-sync" is now active!');

  const socket = new WebSocket('ws://localhost:8080');

  socket.addEventListener('open', () => {
    console.log('WebSocket connection opened');
  });

  socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);

    const { filename, content, error } = JSON.parse(event.data.toString());

    if (error) {
      vscode.window.showErrorMessage(error);
      return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folders found');
      return;
    }

    // Get the root path of the workspace
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Define the path of the file received over the WebSocket connection
    const filePath = path.join(rootPath, filename);

    // Write the contents of the file to disk
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing file ${filename}: ${err.message}`);
        return;
      }

      // Open the file in a new editor and show it alongside the existing editor in a diff view
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside }).then((editor) => {
          const existingEditor = vscode.window.activeTextEditor;
          if (existingEditor) {
            vscode.commands.executeCommand<void>(
              'vscode.diff',
              existingEditor.document.uri,
              editor.document.uri,
              `Comparing ${path.basename(existingEditor.document.uri.fsPath)} to ${path.basename(filePath)}`
            ).then(undefined, (err) => {
              console.error(err);
              vscode.window.showErrorMessage(`Error comparing files: ${err.message}`);
            });
          }
        });
      });
    });
  });

  context.subscriptions.push(vscode.commands.registerCommand('d2c-sync.helloWorld', () => {
    const options: vscode.OpenDialogOptions = {
      canSelectFiles: true,
      canSelectMany: false,
    };

    vscode.window.showOpenDialog(options).then((uris) => {
      if (uris && uris[0]) {
        const filePath = uris[0].fsPath;
        const fileName = path.basename(filePath);

        fs.readFile(filePath, (err, data) => {
          if (err) {
            vscode.window.showErrorMessage(`Error reading file ${fileName}: ${err.message}`);
            return;
          }

          const fileContent = data.toString();

          socket.send(JSON.stringify({ filename: fileName, content: fileContent }));
        });
      }
    });
  }));
}

export function deactivate() {}
