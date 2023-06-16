import { commands, ExtensionContext } from "vscode";
import { ChatLSPPanel } from "./panels/ChatLSPPanel";

export function activate(context: ExtensionContext) {
  // Create the show chatLSP command
  const showChatLSPCommand = commands.registerCommand("hello-world.showChatLSP", () => {
    ChatLSPPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showChatLSPCommand);
}
