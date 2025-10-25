import * as vscode from 'vscode';
import * as path from 'path';
import Papa from 'papaparse';

/**
 * Entry point — called when the extension activates.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('smartViewer.open', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active file open.');
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const ext = path.extname(document.fileName).toLowerCase();

    let html = '';

    try {
      if (ext === '.json') {
        const json = JSON.parse(text);
        html = getJsonWebviewContent(json);
      } else if (ext === '.csv') {
        html = getCsvWebviewContent(text);
      } else {
        vscode.window.showErrorMessage('Unsupported file type. Please open a .json or .csv file.');
        return;
      }
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to render file: ${e.message}`);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'smartDataViewer',
      `Smart Viewer: ${path.basename(document.fileName)}`,
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = html;
  });

  context.subscriptions.push(disposable);
}

/**
 * Deactivation (optional)
 */
export function deactivate() {}

/* ---------------- JSON TREE VIEW ---------------- */

function getJsonWebviewContent(data: any): string {
  const treeHTML = jsonToTree(data);
  return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        :root { color-scheme: light dark; }

        body {
          font-family: var(--vscode-editor-font-family, sans-serif);
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
          padding: 1rem;
          line-height: 1.4;
        }

        h2 {
          color: var(--vscode-editor-foreground);
          border-bottom: 1px solid var(--vscode-editorWidget-border, #555);
          padding-bottom: 0.3rem;
          margin-bottom: 1rem;
        }

        details {
          margin-left: 1rem;
          border-left: 1px solid var(--vscode-editorWidget-border, #444);
          padding-left: 0.5rem;
        }

        summary {
          cursor: pointer;
          color: var(--vscode-textLink-foreground, #569CD6);
          font-weight: 500;
        }

        .key { color: var(--vscode-editor-foreground, #ccc); }
        .value-string { color: var(--vscode-terminal-ansiGreen, #6A9955); }
        .value-number { color: var(--vscode-terminal-ansiCyan, #4FC1FF); }
        .value-boolean { color: var(--vscode-terminal-ansiYellow, #DCDCAA); }
        .value-null { color: var(--vscode-terminal-ansiMagenta, #C586C0); }
        .primitive { margin-left: 1.5rem; }
        .bracket { color: var(--vscode-editorLineNumber-activeForeground, #888); }

        summary:hover {
          background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05));
        }
      </style>
    </head>
    <body>
      <h2>JSON Tree View</h2>
      ${treeHTML}
    </body>
    </html>
  `;
}

function jsonToTree(data: any): string {
  if (Array.isArray(data)) {
    const items = data.map((item, i) => `
      <details open>
        <summary><span class="bracket">[${i}]</span></summary>
        ${jsonToTree(item)}
      </details>
    `).join('');
    return `<div>${items}</div>`;
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data).map(([key, value]) => `
      <details open>
        <summary><span class="key">${key}</span>:</summary>
        ${jsonToTree(value)}
      </details>
    `).join('');
    return `<div>${entries}</div>`;
  } else {
    const type = typeof data;
    const className =
      type === 'string' ? 'value-string' :
      type === 'number' ? 'value-number' :
      type === 'boolean' ? 'value-boolean' :
      data === null ? 'value-null' : '';
    const display = type === 'string' ? `"${data}"` : data;
    return `<div class="primitive ${className}">${display}</div>`;
  }
}

/* ---------------- CSV TABLE VIEW ---------------- */

function getCsvWebviewContent(csvText: string): string {
  const parsed = Papa.parse(csvText.trim(), { header: true });
  const data = parsed.data as any[];
  if (!data.length) return `<p>No CSV data found.</p>`;

  const headers = Object.keys(data[0]);
  const rows = data.map(row => `
    <tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        :root { color-scheme: light dark; }

        body {
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          font-family: var(--vscode-editor-font-family);
          padding: 1rem;
        }

        h2 {
          color: var(--vscode-editor-foreground);
          border-bottom: 1px solid var(--vscode-editorWidget-border, #555);
          padding-bottom: 0.3rem;
          margin-bottom: 1rem;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        th, td {
          border: 1px solid var(--vscode-editorWidget-border);
          padding: 6px 10px;
          text-align: left;
        }

        th {
          background: var(--vscode-sideBar-background);
        }

        tr:nth-child(even) {
          background: var(--vscode-editorWidget-background);
        }

        tr:hover {
          background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05));
        }
      </style>
    </head>
    <body>
      <h2>CSV Table View</h2>
      <table>
        <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;
}

function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
