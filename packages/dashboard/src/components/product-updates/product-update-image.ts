export type ProductUpdateImageAspect = "original" | "16:9" | "4:3" | "1:1";
export type ProductUpdateCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type ProductUpdateCropCorner = "nw" | "ne" | "se" | "sw";

function aspectValue(
  aspect: ProductUpdateImageAspect,
  width: number,
  height: number,
) {
  if (aspect === "original") return width / height;
  const [x, y] = aspect.split(":").map(Number);
  return x / y;
}

export function calculateProductUpdateCrop(
  width: number,
  height: number,
  aspect: ProductUpdateImageAspect,
  focalX: number,
  focalY: number,
) {
  const target = aspectValue(aspect, width, height);
  let cropWidth = width;
  let cropHeight = height;
  if (width / height > target) cropWidth = height * target;
  else cropHeight = width / target;
  return {
    x: (width - cropWidth) * (focalX / 100),
    y: (height - cropHeight) * (focalY / 100),
    width: cropWidth,
    height: cropHeight,
  };
}

export function calculateProductUpdateOutput(
  crop: { width: number; height: number },
  requestedWidth: number,
) {
  const width = Math.max(1, Math.min(requestedWidth, Math.round(crop.width)));
  return {
    width,
    height: Math.max(1, Math.round(width / (crop.width / crop.height))),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function moveProductUpdateCrop(
  crop: ProductUpdateCrop,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number,
): ProductUpdateCrop {
  return {
    ...crop,
    x: clamp(crop.x + deltaX, 0, Math.max(0, imageWidth - crop.width)),
    y: clamp(crop.y + deltaY, 0, Math.max(0, imageHeight - crop.height)),
  };
}

export function resizeProductUpdateCropFromCorner(
  crop: ProductUpdateCrop,
  corner: ProductUpdateCropCorner,
  pointerX: number,
  pointerY: number,
  imageWidth: number,
  imageHeight: number,
  minimumWidth = 1,
): ProductUpdateCrop {
  const growsRight = corner === "ne" || corner === "se";
  const growsDown = corner === "se" || corner === "sw";
  const anchorX = growsRight ? crop.x : crop.x + crop.width;
  const anchorY = growsDown ? crop.y : crop.y + crop.height;
  const directionX = growsRight ? 1 : -1;
  const directionY = growsDown ? 1 : -1;
  const aspect = crop.width / crop.height;
  const requestedWidthX = (pointerX - anchorX) * directionX;
  const requestedHeight = (pointerY - anchorY) * directionY;
  const requestedWidthY = requestedHeight * aspect;
  const projectedWidth =
    (requestedWidthX + requestedWidthY / (aspect * aspect)) /
    (1 + 1 / (aspect * aspect));
  const horizontalCapacity = growsRight ? imageWidth - anchorX : anchorX;
  const verticalCapacity = growsDown ? imageHeight - anchorY : anchorY;
  const maximumWidth = Math.max(1, Math.min(horizontalCapacity, verticalCapacity * aspect));
  const width = clamp(projectedWidth, Math.min(minimumWidth, maximumWidth), maximumWidth);
  const height = width / aspect;

  return {
    x: growsRight ? anchorX : anchorX - width,
    y: growsDown ? anchorY : anchorY - height,
    width,
    height,
  };
}
