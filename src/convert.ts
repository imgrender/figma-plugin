import { convertRgbColorToHexColor } from "@create-figma-plugin/utilities";
import {
  Blueprint,
  TextComponent,
  LineComponent,
  BlockComponent,
} from "./models";

export function convert(node: Readonly<SceneNode>): string {
  const blueprintOriginX = node.x;
  const blueprintOriginY = node.y;

  const blueprint: Blueprint = {
    height: node.height,
    width: node.width,
    backgroundColor: "#ffffff",
  };

  // 递归遍历所有子节点
  if (node.type === "GROUP") {
    // 嵌套类节点
  } else if (node.type === "TEXT") {
    // 原始节点
  } else if (node.type === "RECTANGLE") {
  } else if (node.type === "LINE") {
  }

  console.log(node.x, node.y);
  return JSON.stringify(blueprint, null, "\t");
}

function parseTextNode(node: Readonly<TextNode>): TextComponent | null {
  if (!node.visible) {
    return null;
  }

  const paint = node.strokes.find((paint) => {
    return paint.visible;
  });
  if (paint === undefined) {
    return null;
  }
  const color = parsePaint(paint);
  if (color === null) {
    return null;
  }

  let fontSize = 1;
  if (node.fontSize !== figma.mixed) {
    fontSize = node.fontSize;
  }

  let text: TextComponent = {
    x: node.x,
    y: node.y,
    text: node.characters,
    width: node.width,
    font: "",
    fontSize: fontSize,
    lineHeight: 0,
    lineSpacing: 0,
    color: color,
    textAlign: node.textAlignHorizontal,
  };

  return text;
}

function parseRectangleNode(
  node: Readonly<RectangleNode>
): BlockComponent | null {
  if (!node.visible) {
    return null;
  }

  let block: BlockComponent = {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  };

  // 角半径
  if (node.cornerRadius !== figma.mixed) {
    // FIXME: 可能为小数
    block.borderRadius = node.cornerRadius;
  } else {
    block.borderTopLeftRadius = node.topLeftRadius;
    block.borderTopRightRadius = node.topRightRadius;
    block.borderBottomLeftRadius = node.bottomLeftRadius;
    block.borderBottomRightRadius = node.bottomRightRadius;
  }

  // 边框
  if (node.strokes.length > 0) {
    const paint = node.strokes.find((paint) => {
      return paint.visible;
    });

    if (paint !== undefined) {
      const color = parsePaint(paint);
      if (color !== null) {
        block.borderColor = color;
      }
    }

    if (node.strokeWeight !== figma.mixed) {
      block.borderWidth = node.strokeWeight;
    } else {
      block.borderTopWidth = node.strokeTopWeight;
      block.borderRightWidth = node.strokeRightWeight;
      block.borderBottomWidth = node.strokeBottomWeight;
      block.borderLeftWidth = node.strokeLeftWeight;
    }
  }

  // 背景
  if (node.fills !== figma.mixed && node.fills.length > 0) {
    const paint = node.fills.find((paint) => {
      return paint.visible;
    });

    if (paint !== undefined) {
      const color = parsePaint(paint);
      if (color !== null) {
        block.backgroundColor = color;
      }
    }
  }

  return block;
}

function parseLineNode(node: Readonly<LineNode>): LineComponent | null {
  if (!node.visible) {
    return null;
  }

  const paint = node.strokes.find((paint) => {
    return paint.visible;
  });
  if (paint === undefined) {
    return null;
  }

  const color = parsePaint(paint);
  if (color === null) {
    return null;
  }

  let line: LineComponent = {
    startX: Math.round(node.x),
    startY: Math.round(node.y),
    endX: Math.round(node.x + node.width),
    endY: Math.round(node.y + node.height),
    width: 0,
    color: color,
  };

  if (node.strokeWeight !== figma.mixed) {
    line.width = node.strokeWeight;
  }

  return line;
}

function parsePaint(node: Readonly<Paint>): null | string {
  if (node.type === "SOLID") {
    return convertRgbColorToHexColor(node.color);
  }
  return null;
}
