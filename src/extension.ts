import { commands, ExtensionContext } from "vscode";
import { ChatLSPPanel } from "./panels/ChatLSPPanel";

export function activate(context: ExtensionContext) {
  const showChatLSPCommand = commands.registerCommand("hello-world.showHelloWorld", () => {
    ChatLSPPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showChatLSPCommand);
}
