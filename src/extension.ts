/* eslint-disable @typescript-eslint/naming-convention */
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
    // const filePath1 = path.join(rootPath, 'abc.css');
    const filePath2 = path.join(rootPath, filename);
    const fileContent2 =  require('fs').readFileSync(filePath2);
    // Write the contents of the file to disk
    // fs.writeFile(filePath1, content, (err) => {
    //   if (err) {
    //     vscode.window.showErrorMessage(`Error writing file ${filename}: ${err.message}`);
    //     return;
    //   }

      Promise.all([
        vscode.workspace.openTextDocument({content: content}),
        vscode.workspace.openTextDocument(filePath2),
      ]).then(([doc1, doc2]) => {
        vscode.window.showTextDocument(doc1).then(editor1 => {
          vscode.window.showTextDocument(doc2).then(editor2 => {
    
            vscode.commands.executeCommand<void>(
              'vscode.diff',
              doc1.uri,
              doc2.uri,
              `Comparing code from D2C to local`
            ).then(undefined, (err) => {
              console.error(err);
              vscode.window.showErrorMessage(`Error comparing files: ${err.message}`);
            });
          });
        });
      });
    // });
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
