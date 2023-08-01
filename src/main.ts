import { emit, on, once, showUI } from "@create-figma-plugin/utilities";
import { convert } from "./convert";

import {
  CloseHandler,
  CreateRectanglesHandler,
  OutputHandler,
  SaveToClipboardHandler,
} from "./types";

const NOTI_TIME_LONG = 1500;

export default function () {
  once<CreateRectanglesHandler>("CREATE_RECTANGLES", function (count: number) {
    const nodes: Array<SceneNode> = [];
    for (let i = 0; i < count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [
        {
          color: { b: 0, g: 0.5, r: 1 },
          type: "SOLID",
        },
      ];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
    figma.closePlugin();
  });

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
      const data = convert(selection[0]);
      emit<SaveToClipboardHandler>("SAVE_TO_CLIPBOARD", data);
      figma.notify("已复制到剪贴板中", {
        timeout: NOTI_TIME_LONG,
        error: false,
      });
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
