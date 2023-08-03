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
  console.log(node);
  if (!node.visible) {
    return "";
  }

  const originCoord: Coord = {
    x: Math.round(node.absoluteRenderBounds!.x), // 应该使用渲染边框
    y: Math.round(node.absoluteRenderBounds!.y),
  };

  const blueprint: Blueprint = {
    width: Math.round(node.absoluteRenderBounds!.width),
    height: Math.round(node.absoluteRenderBounds!.height),
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

  const renderBounds = node.absoluteRenderBounds;

  let text: TextComponent = {
    x: Math.abs(Math.round(renderBounds!.x) - originCoord.x),
    y: Math.abs(Math.round(renderBounds!.y) - originCoord.y),
    text: node.characters,
    width: Math.abs(Math.round(renderBounds!.width)),
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
  console.log(node);
  const renderBounds = node.absoluteRenderBounds;

  let block: BlockComponent = {
    x: Math.abs(Math.round(renderBounds!.x) - originCoord.x),
    y: Math.abs(Math.round(renderBounds!.y) - originCoord.y),
    width: Math.round(renderBounds!.width),
    height: Math.round(renderBounds!.height),
    zIndex: zIndex,
  };

  // 角半径
  if (node.cornerRadius !== figma.mixed) {
    if (node.cornerRadius > 0) {
      block.borderRadius = Math.round(node.cornerRadius);
    }
  } else {
    if (node.topLeftRadius > 0) {
      block.borderTopLeftRadius = Math.round(node.topLeftRadius);
    }
    if (node.topRightRadius > 0) {
      block.borderTopRightRadius = Math.round(node.topRightRadius);
    }
    if (node.bottomLeftRadius > 0) {
      block.borderBottomLeftRadius = Math.round(node.bottomLeftRadius);
    }
    if (node.bottomRightRadius > 0) {
      block.borderBottomRightRadius = Math.round(node.bottomRightRadius);
    }
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
      if (node.strokeWeight > 0) {
        block.borderWidth = Math.round(node.strokeWeight);
      }
    } else {
      if (node.strokeTopWeight > 0) {
        block.borderTopWidth = Math.round(node.strokeTopWeight);
      }
      if (node.strokeRightWeight > 0) {
        block.borderRightWidth = Math.round(node.strokeRightWeight);
      }
      if (node.strokeBottomWeight > 0) {
        block.borderBottomWidth = Math.round(node.strokeBottomWeight);
      }
      if (node.strokeLeftWeight > 0) {
        block.borderLeftWidth = Math.round(node.strokeLeftWeight);
      }
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

  console.log(node);
  const renderBounds = node.absoluteRenderBounds;

  let line: LineComponent = {
    startX: Math.abs(Math.round(renderBounds!.x) - originCoord.x),
    startY: Math.abs(Math.round(renderBounds!.y) - originCoord.y),
    endX: Math.abs(
      Math.round(renderBounds!.x + renderBounds!.width) - originCoord.x
    ),
    endY: Math.abs(
      Math.round(renderBounds!.y + renderBounds!.height) - originCoord.y
    ),
    width: 0,
    color: color,
    zIndex: zIndex,
  };

  if (node.strokeWeight !== figma.mixed) {
    line.width = Math.round(node.strokeWeight);
  }

  return line;
}

function parsePaint(node: Readonly<Paint>): null | string {
  if (node.type === "SOLID") {
    let color = convertRgbColorToHexColor(node.color);
    if (color === null) {
      return null;
    }
    return "#" + color;
  }
  return null;
}
