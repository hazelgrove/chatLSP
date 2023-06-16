import { commands, ExtensionContext, Webview, WebviewViewProvider,WebviewView, Uri, WebviewViewResolveContext, SnippetString, window,CancellationToken,  } from "vscode";
import { ChatLSPPanel } from "./panels/ChatLSPPanel";
import { getUri } from "./utilities/getUri";
import { getNonce } from "./utilities/getNonce";

commands.registerTextEditorCommand('insertTEXT', (editor, edit) => {
	editor.selections.forEach((selection, i) => {
			let text = "<TEXT> ";// + i;
			edit.insert(selection.active, text);  // insert at current cursor
	})
});

export function activate(context: ExtensionContext) {
  // Create the show chatLSP command
  const showChatLSPCommand = commands.registerCommand("hello-world.showChatLSP", () => {
    ChatLSPPanel.render(context.extensionUri);
  });

  const provider = new ColorsViewProvider(context.extensionUri);

	context.subscriptions.push(
		window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));

	context.subscriptions.push(
		commands.registerCommand('calicoColors.addColor', () => {
			provider.addColor();
		}));

	context.subscriptions.push(
		commands.registerCommand('calicoColors.clearColors', () => {
			provider.clearColors();
		}));

	// Register the Sidebar Panel
	const sidebarProvider = new ColorsViewProvider(context.extensionUri);
	context.subscriptions.push(
		window.registerWebviewViewProvider(
			"myextension-sidebar",
			sidebarProvider
		)
	);

  // Add command to the extension context
  context.subscriptions.push(showChatLSPCommand);
}

class ColorsViewProvider implements WebviewViewProvider {

	public static readonly viewType = 'calicoColors.colorsView';

	private _view?: WebviewView;

	constructor(

		private readonly _extensionUri: Uri,
	) { }

	public resolveWebviewView(
		webviewView: WebviewView,
		context: WebviewViewResolveContext,
		_token: CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		

		webviewView.webview.onDidReceiveMessage((message: any) => {
			const command = message.command;
			const text = message.text;

			switch (command) {
				case "hello":
					// Code that should run in response to the hello message command
					window.showInformationMessage(text);
					return;
			  case "paste":
					
					//window.showInformationMessage(text);
					
				commands.executeCommand("workbench.action.focusActiveEditorGroup");
					//commands.executeCommand("workbench.action.files.newUntitledFile");
					commands.executeCommand("insertTEXT");
					//commands.executeCommand("editor.action.clipboardPasteAction", text);

				// Add more switch case statements here as more webview message commands
				// are created within the webview context (i.e. inside media/main.js)
			}
		});
	}

	public addColor() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addColor' });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearColors' });
		}
	}

	private _getHtmlForWebview(webview: Webview) {
    // The CSS file from the SolidJS build output
    const stylesUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the SolidJS build output
    const scriptUri = getUri(webview, this._extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>ChatLSP</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}