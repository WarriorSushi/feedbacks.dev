export type ProductUpdateImageAspect = "original" | "16:9" | "4:3" | "1:1";

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
