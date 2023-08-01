import { convertRgbColorToHexColor } from "@create-figma-plugin/utilities";
import {
  Blueprint,
  TextComponent,
  LineComponent,
  BlockComponent,
} from "./models";

type Coord = {
  x: number;
  y: number;
};

export function convert(node: Readonly<SceneNode>): string {
  const originCoord: Coord = { x: node.x, y: node.y };

  const blueprint: Blueprint = {
    height: node.height,
    width: node.width,
    backgroundColor: "#ffffff",
  };

  // DFS
  let stack: Array<Readonly<SceneNode>> = [];
  let zIndex = 0;
  stack.push(node);
  while (stack.length) {
    let item = stack.pop();

    // 解析节点
    if (item?.type === "TEXT") {
      let text = parseTextNode(item, originCoord, zIndex);
      if (text !== null) {
        if (blueprint.texts === undefined) {
          blueprint.texts = [];
        }
        blueprint.texts?.push(text);
      }
    } else if (item?.type === "RECTANGLE") {
      let block = parseRectangleNode(item, originCoord, zIndex);
      console.log(block);
      if (block !== null) {
        if (blueprint.blocks === undefined) {
          blueprint.blocks = [];
        }
        blueprint.blocks.push(block);
      }
    } else if (item?.type === "LINE") {
      let line = parseLineNode(item, originCoord, zIndex);
      if (line !== null) {
        if (blueprint.lines === undefined) {
          blueprint.lines = [];
        }
        blueprint.lines?.push(line);
      }
    } else if (item?.type === "GROUP") {
      // GroupNode 具有 children 属性
      for (let i = 0; i < item.children.length; i++) {
        stack.push(item.children[i]);
      }
    }

    zIndex--;
  }

  // 处理zIndex，全部转为正数
  blueprint.texts?.forEach((text) => {
    text.zIndex -= zIndex;
  });
  blueprint.blocks?.forEach((block) => {
    block.zIndex -= zIndex;
  });
  blueprint.lines?.forEach((line) => {
    line.zIndex -= zIndex;
  });
  blueprint.qrcodes?.forEach((qrcode) => {
    qrcode.zIndex -= zIndex;
  });
  blueprint.images?.forEach((image) => {
    image.zIndex -= zIndex;
  });

  console.log(blueprint);

  return JSON.stringify(blueprint, null, "\t");
}

function parseTextNode(
  node: Readonly<TextNode>,
  originCoord: Coord,
  zIndex: number
): TextComponent | null {
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
    x: node.x - originCoord.x,
    y: node.y - originCoord.y,
    text: node.characters,
    width: node.width,
    font: "",
    fontSize: fontSize,
    lineHeight: 0,
    lineSpacing: 0,
    color: color,
    textAlign: node.textAlignHorizontal,
    zIndex: zIndex,
  };

  return text;
}

function parseRectangleNode(
  node: Readonly<RectangleNode>,
  originCoord: Coord,
  zIndex: number
): BlockComponent | null {
  if (!node.visible) {
    return null;
  }

  let block: BlockComponent = {
    x: node.x - originCoord.x,
    y: node.y - originCoord.y,
    width: node.width,
    height: node.height,
    zIndex: zIndex,
  };

  // 角半径
  if (node.cornerRadius !== figma.mixed) {
    // FIXME: 可能为小数
    if (node.cornerRadius > 0) {
      block.borderRadius = node.cornerRadius;
    }
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

function parseLineNode(
  node: Readonly<LineNode>,
  originCoord: Coord,
  zIndex: number
): LineComponent | null {
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
    startX: Math.round(node.x) - originCoord.x,
    startY: Math.round(node.y) - originCoord.y,
    endX: Math.round(node.x + node.width) - originCoord.x,
    endY: Math.round(node.y + node.height) - originCoord.y,
    width: 0,
    color: color,
    zIndex: zIndex,
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
