import { commands, ExtensionContext, Webview, WebviewViewProvider,WebviewView, Uri, WebviewViewResolveContext, SnippetString, window,CancellationToken,  } from "vscode";
import { ChatLSPPanel } from "./panels/ChatLSPPanel";
import { getUri } from "../utilities/getUri";
import { getNonce } from "./utilities/getNonce";

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

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						window.activeTextEditor?.insertSnippet(new SnippetString(`#${data.value}`));
						break;
					}
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
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>

				<button class="add-color-button">Add Color</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}