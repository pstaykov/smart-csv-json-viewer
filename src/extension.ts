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

/* ---------------- CSV TABLE VIEW (interactive) ---------------- */

function getCsvWebviewContent(csvText: string): string {
  const parsed = Papa.parse(csvText.trim(), { header: true });
  const data = parsed.data as any[];
  if (!data.length) return `<p>No CSV data found.</p>`;

  const headers = Object.keys(data[0]);

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

        input, select, button {
          margin-bottom: 0.8rem;
          padding: 6px 10px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
        }

        input { width: 40%; }
        select { width: 40%; }

        button {
          cursor: pointer;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          margin-left: 0.5rem;
        }

        button:hover {
          background: var(--vscode-button-hoverBackground);
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

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
      </style>
    </head>
    <body>
      <h2>CSV Table View</h2>
      <div class="controls">
        <input type="text" id="filterInput" placeholder="Filter rows..." />
        <select id="sortColumn">
          ${headers.map(h => `<option value="${h}">${escapeHtml(h)}</option>`).join('')}
        </select>
        <button id="sortToggle" data-dir="asc">▲ Asc</button>
      </div>

      <table id="dataTable">
        <thead>
          <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row =>
            `<tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>

      <script>
        const table = document.getElementById('dataTable');
        const input = document.getElementById('filterInput');
        const select = document.getElementById('sortColumn');
        const toggle = document.getElementById('sortToggle');

        // Filter rows on input
        input.addEventListener('input', () => {
          const term = input.value.toLowerCase();
          table.querySelectorAll('tbody tr').forEach(row => {
            const visible = Array.from(row.cells).some(cell =>
              cell.innerText.toLowerCase().includes(term)
            );
            row.style.display = visible ? '' : 'none';
          });
        });

        // Sort table
        function sortTable(direction) {
          const column = select.value;
          const idx = Array.from(table.querySelector('thead tr').cells)
            .findIndex(th => th.textContent === column);

          const rows = Array.from(table.querySelector('tbody').rows);

          rows.sort((a, b) => {
            const A = a.cells[idx].innerText.toLowerCase();
            const B = b.cells[idx].innerText.toLowerCase();
            return A.localeCompare(B) * direction;
          });

          const tbody = table.querySelector('tbody');
          tbody.innerHTML = '';
          rows.forEach(r => tbody.appendChild(r));
        }

        // Toggle sorting direction
        toggle.addEventListener('click', () => {
          const dir = toggle.dataset.dir === 'asc' ? 'desc' : 'asc';
          toggle.dataset.dir = dir;
          toggle.textContent = dir === 'asc' ? '▲ Asc' : '▼ Desc';
          sortTable(dir === 'asc' ? 1 : -1);
        });
      </script>
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
