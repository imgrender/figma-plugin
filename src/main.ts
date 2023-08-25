import { emit, on, once, showUI } from "@create-figma-plugin/utilities";
import { convert } from "./convert";

import { CloseHandler, OutputHandler, SaveToClipboardHandler } from "./types";

const NOTI_TIME_LONG = 1500;

export default function () {
  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });

  on<OutputHandler>("OUTPUT", function () {
    let selection = figma.currentPage.selection;
    console.log(selection);
    if (selection.length > 1) {
      showError(
        "More than one layer selected. Please select a single layer to output.",
        3000
      );
    } else if (selection.length === 1) {
      const node = selection[0];
      let data = "";
      if (node.type === "GROUP") {
        data = convert(node);
      } else if (node.type === "TEXT") {
        data = convert(node);
      } else if (node.type === "RECTANGLE") {
        data = convert(node);
      } else if (node.type === "LINE") {
        data = convert(node);
      }
      if (data === "") {
        figma.notify("Nothing to export.", {
          timeout: NOTI_TIME_LONG,
          error: true,
        });
      } else {
        emit<SaveToClipboardHandler>("SAVE_TO_CLIPBOARD", data);
        figma.notify("Successful! Copied to clipboard.", {
          timeout: NOTI_TIME_LONG,
          error: false,
        });
      }
    } else {
      showError(
        "Nothing selected. Please select a layer to output.",
        NOTI_TIME_LONG
      );
    }
  });

  showUI({
    height: 137,
    width: 240,
  });
}

function showError(message: string, time: number) {
  figma.notify(message, { timeout: time });
}
