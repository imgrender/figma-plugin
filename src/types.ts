import { EventHandler } from "@create-figma-plugin/utilities";

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface OutputHandler extends EventHandler {
  name: "OUTPUT";
  handler: () => void;
}

export interface SaveToClipboardHandler extends EventHandler {
  name: "SAVE_TO_CLIPBOARD";
  hander: (json: string) => void;
}
