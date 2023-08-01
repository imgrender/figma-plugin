interface BorderAttributes {
  borderColor?: string;
  borderWidth?: number;
  borderTopColor?: string;
  borderTopWidth?: number;
  borderBottomColor?: string;
  borderBottomWidth?: number;
  borderRightColor?: string;
  borderRightWidth?: number;
  borderLeftColor?: string;
  borderLeftWidth?: number;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
}

export interface TextComponent {
  x: number;
  y: number;
  text: string;
  width: number;
  font: string;
  fontSize: number;
  lineHeight: number;
  lineSpacing: number;
  color: string;
  textAlign: string;
  zIndex: number;
}

export interface ImageComponent extends BorderAttributes {
  x: number;
  y: number;
  url: string;
  width: number;
  height: number;
  zIndex: number;
}

export interface LineComponent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color?: string;
  zIndex: number;
}

export interface QrcodeComponent {
  x: number;
  y: number;
  size: number;
  content: string;
  foregroundColor: string;
  backgroundColor: string;
  zIndex: number;
}

export interface BlockComponent extends BorderAttributes {
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  zIndex: number;
}

export interface Blueprint extends BorderAttributes {
  height: number;
  width: number;
  backgroundColor: string;
  texts?: Array<TextComponent>;
  images?: Array<ImageComponent>;
  lines?: Array<LineComponent>;
  qrcodes?: Array<QrcodeComponent>;
  blocks?: Array<BlockComponent>;
}
