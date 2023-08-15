import { convertRgbColorToHexColor } from "@create-figma-plugin/utilities";
import {
  Blueprint,
  TextComponent,
  LineComponent,
  BlockComponent,
  BorderAttributes,
  ImageComponent,
} from "./models";

type Coord = {
  x: number;
  y: number;
};

export function convert(
  node: Readonly<GroupNode | TextNode | LineNode | RectangleNode>
): string {
  console.log(node);
  if (!node.visible || node.absoluteRenderBounds === null) {
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

  // DFS（深度优先遍历）
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
      if (!item.isAsset) {
        let block = parseRectangleNode(item, originCoord, zIndex);
        if (block !== null) {
          if (blueprint.blocks === undefined) {
            blueprint.blocks = [];
          }
          blueprint.blocks.push(block);
        }
      } else {
        let image = parseImageNode(item, originCoord, zIndex);
        if (image !== null) {
          if (blueprint.images === undefined) {
            blueprint.images = [];
          }
          blueprint.images.push(image);
        }
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

  let fontSize = 18;
  if (node.fontSize !== figma.mixed) {
    fontSize = node.fontSize;
  }

  // FIXME:先只支持 SourceHanSansSC 系列字体，其他字体暂时默认为 SourceHanSansSC-Normal
  let font = "SourceHanSansSC-Normal";
  if (node.fontName !== figma.mixed) {
    if (node.fontName.family === "Source Han Sans SC") {
      font = "SourceHanSansSC-" + node.fontName.style;
    }
  }

  const renderBounds = node.absoluteRenderBounds;
  let x = Math.abs(Math.round(renderBounds!.x) - originCoord.x);
  let width = Math.abs(Math.round(renderBounds!.width));
  let text: TextComponent = {
    x: x + Math.ceil(width / 2),
    y: Math.abs(Math.round(renderBounds!.y) - originCoord.y),
    text: node.characters,
    width: width,
    font: font,
    fontSize: fontSize,
    textAlign: node.textAlignHorizontal.toLowerCase(),
    zIndex: zIndex,
  };

  // 行高
  if (node.lineHeight !== figma.mixed && node.lineHeight.unit === "PIXELS") {
    text.lineHeight = node.lineHeight.value;
  }

  // 填充
  if (node.fills !== figma.mixed && node.fills.length > 0) {
    const paint = node.fills.find((paint) => {
      return paint.visible;
    });

    if (paint === undefined) {
      return null; // 当无填充时，不返回该对象
    }

    const color = parsePaint(paint);
    if (color !== null) {
      text.color = color;
    }
  }

  return text;
}

function parseFont(fontName: FontName): string {
  // FIXME:先只支持 SourceHanSansSC 系列字体，其他字体暂时默认为 SourceHanSansSC-Normal
  if (fontName.family === "Source Han Sans SC") {
    return "SourceHanSansSC-" + fontName.style;
  }
  return "SourceHanSansSC-Normal";
}

function parseRectangleNode(
  node: Readonly<RectangleNode>,
  originCoord: Coord,
  zIndex: number
): BlockComponent | null {
  if (!node.visible) {
    return null;
  }

  const border = parseBorderAttributesFromNode(node);
  const boundingBox = node.absoluteBoundingBox;
  let block: BlockComponent = {
    x: Math.abs(Math.round(boundingBox!.x) - originCoord.x),
    y: Math.abs(Math.round(boundingBox!.y) - originCoord.y),
    width: Math.round(boundingBox!.width),
    height: Math.round(boundingBox!.height),
    zIndex: zIndex,
    ...border,
  };

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

function parseImageNode(
  node: Readonly<RectangleNode>,
  originCoord: Coord,
  zIndex: number
): ImageComponent | null {
  if (!node.visible) {
    return null;
  }

  const border = parseBorderAttributesFromNode(node);
  const boundingBox = node.absoluteBoundingBox;
  let image: ImageComponent = {
    x: Math.abs(Math.round(boundingBox!.x) - originCoord.x),
    y: Math.abs(Math.round(boundingBox!.y) - originCoord.y),
    width: Math.round(boundingBox!.width),
    height: Math.round(boundingBox!.height),
    url: "Please replace with accessible image url",
    zIndex: zIndex,
    ...border,
  };

  // 背景
  if (node.fills !== figma.mixed && node.fills.length > 0) {
    const paint = node.fills.find((paint) => {
      return paint.visible;
    });

    if (paint === undefined || paint.type !== "IMAGE") {
      return null; // 不可见或者类型不是图片
    }
  }

  return image;
}

function parseBorderAttributesFromNode(
  node: Readonly<RectangleNode>
): BorderAttributes | {} {
  if (!node.visible) {
    return {};
  }

  let border: BorderAttributes = {};
  // 角半径
  if (node.cornerRadius !== figma.mixed) {
    if (node.cornerRadius > 0) {
      border.borderRadius = Math.round(node.cornerRadius);
    }
  } else {
    if (node.topLeftRadius > 0) {
      border.borderTopLeftRadius = Math.round(node.topLeftRadius);
    }
    if (node.topRightRadius > 0) {
      border.borderTopRightRadius = Math.round(node.topRightRadius);
    }
    if (node.bottomLeftRadius > 0) {
      border.borderBottomLeftRadius = Math.round(node.bottomLeftRadius);
    }
    if (node.bottomRightRadius > 0) {
      border.borderBottomRightRadius = Math.round(node.bottomRightRadius);
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
        border.borderColor = color;
      }
    }

    if (node.strokeWeight !== figma.mixed) {
      if (node.strokeWeight > 0) {
        border.borderWidth = Math.round(node.strokeWeight);
        border.strokeAlign = node.strokeAlign;
      }
    }
  }

  return border;
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
