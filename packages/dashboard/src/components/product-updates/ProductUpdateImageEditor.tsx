"use client";

import * as React from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  calculateProductUpdateCrop,
  calculateProductUpdateOutput,
  moveProductUpdateCrop,
  resizeProductUpdateCropFromCorner,
  type ProductUpdateCrop,
  type ProductUpdateCropCorner,
  type ProductUpdateImageAspect,
} from "./product-update-image";

const ASPECTS: Array<{ value: ProductUpdateImageAspect; label: string }> = [
  { value: "original", label: "Original" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "Square" },
];

const OUTPUT_WIDTHS = [640, 960, 1280, 1600] as const;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const CROP_CORNERS: Array<{
  value: ProductUpdateCropCorner;
  label: string;
  className: string;
}> = [
  {
    value: "nw",
    label: "Resize from top left",
    className: "-left-2 -top-2 cursor-nwse-resize",
  },
  {
    value: "ne",
    label: "Resize from top right",
    className: "-right-2 -top-2 cursor-nesw-resize",
  },
  {
    value: "se",
    label: "Resize from bottom right",
    className: "-bottom-2 -right-2 cursor-nwse-resize",
  },
  {
    value: "sw",
    label: "Resize from bottom left",
    className: "-bottom-2 -left-2 cursor-nesw-resize",
  },
];

type CropInteraction =
  | {
      kind: "move";
      startClientX: number;
      startClientY: number;
      startCrop: ProductUpdateCrop;
    }
  | {
      kind: "resize";
      corner: ProductUpdateCropCorner;
      startCrop: ProductUpdateCrop;
    };

export function ProductUpdateImageEditor({
  file,
  busy,
  onCancel,
  onApply,
  onPreviewChange,
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
  onPreviewChange: (url: string | null) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const interactionRef = React.useRef<CropInteraction | null>(null);
  const previewUrlRef = React.useRef<string | null>(null);
  const previewSequenceRef = React.useRef(0);
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [aspect, setAspect] = React.useState<ProductUpdateImageAspect>("16:9");
  const [crop, setCrop] = React.useState<ProductUpdateCrop | null>(null);
  const [outputWidth, setOutputWidth] = React.useState(1280);
  const [editorError, setEditorError] = React.useState<string | null>(null);

  React.useEffect(() => {
    previewSequenceRef.current += 1;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    onPreviewChange(null);

    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.onload = () => {
      setEditorError(null);
      setImage(nextImage);
      setAspect("16:9");
      setCrop(
        calculateProductUpdateCrop(
          nextImage.naturalWidth,
          nextImage.naturalHeight,
          "16:9",
          50,
          50,
        ),
      );
    };
    nextImage.onerror = () =>
      setEditorError("This image could not be opened. Choose a valid JPEG or PNG file.");
    nextImage.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, onPreviewChange]);

  React.useEffect(
    () => () => {
      previewSequenceRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      onPreviewChange(null);
    },
    [onPreviewChange],
  );

  const output = crop
    ? calculateProductUpdateOutput(crop, outputWidth)
    : { width: outputWidth, height: Math.round(outputWidth / (16 / 9)) };
  const finalWidth = output.width;
  const finalHeight = output.height;

  function selectAspect(nextAspect: ProductUpdateImageAspect) {
    setAspect(nextAspect);
    if (!image) return;
    setCrop(
      calculateProductUpdateCrop(
        image.naturalWidth,
        image.naturalHeight,
        nextAspect,
        50,
        50,
      ),
    );
  }

  function displayedImageRect() {
    return imageRef.current?.getBoundingClientRect() ?? null;
  }

  function clientToImagePoint(clientX: number, clientY: number) {
    const rect = displayedImageRect();
    if (!rect || !image) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * image.naturalWidth,
      y: ((clientY - rect.top) / rect.height) * image.naturalHeight,
    };
  }

  function beginMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!crop) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "move",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCrop: crop,
    };
  }

  function beginResize(
    event: React.PointerEvent<HTMLButtonElement>,
    corner: ProductUpdateCropCorner,
  ) {
    if (!crop) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = { kind: "resize", corner, startCrop: crop };
  }

  function continueInteraction(event: React.PointerEvent<HTMLButtonElement>) {
    const interaction = interactionRef.current;
    const rect = displayedImageRect();
    if (!interaction || !rect || !image) return;
    event.preventDefault();
    if (interaction.kind === "move") {
      setCrop(
        moveProductUpdateCrop(
          interaction.startCrop,
          ((event.clientX - interaction.startClientX) / rect.width) *
            image.naturalWidth,
          ((event.clientY - interaction.startClientY) / rect.height) *
            image.naturalHeight,
          image.naturalWidth,
          image.naturalHeight,
        ),
      );
      return;
    }
    const point = clientToImagePoint(event.clientX, event.clientY);
    if (!point) return;
    const minimumWidth = (48 / rect.width) * image.naturalWidth;
    setCrop(
      resizeProductUpdateCropFromCorner(
        interaction.startCrop,
        interaction.corner,
        point.x,
        point.y,
        image.naturalWidth,
        image.naturalHeight,
        minimumWidth,
      ),
    );
  }

  function endInteraction(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    interactionRef.current = null;
  }

  function moveWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!crop || !image || !event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 2;
    const deltaX = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const deltaY = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    setCrop(
      moveProductUpdateCrop(
        crop,
        deltaX,
        deltaY,
        image.naturalWidth,
        image.naturalHeight,
      ),
    );
  }

  function resizeWithKeyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
    corner: ProductUpdateCropCorner,
  ) {
    if (!crop || !image || !event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 2;
    const cornerX = corner === "ne" || corner === "se" ? crop.x + crop.width : crop.x;
    const cornerY = corner === "se" || corner === "sw" ? crop.y + crop.height : crop.y;
    const deltaX = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const deltaY = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    setCrop(
      resizeProductUpdateCropFromCorner(
        crop,
        corner,
        cornerX + deltaX,
        cornerY + deltaY,
        image.naturalWidth,
        image.naturalHeight,
        Math.max(1, image.naturalWidth * 0.05),
      ),
    );
  }

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !crop) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    context.clearRect(0, 0, finalWidth, finalHeight);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      finalWidth,
      finalHeight,
    );
    const previewSequence = ++previewSequenceRef.current;
    const mimeType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const previewCanvas = document.createElement("canvas");
    const previewWidth = Math.min(finalWidth, 480);
    const previewHeight = Math.max(
      1,
      Math.round((previewWidth / finalWidth) * finalHeight),
    );
    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;
    const previewContext = previewCanvas.getContext("2d");
    if (!previewContext) return;
    previewContext.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      previewWidth,
      previewHeight,
    );
    previewCanvas.toBlob(
      (blob) => {
        if (!blob || previewSequence !== previewSequenceRef.current) return;
        const nextPreviewUrl = URL.createObjectURL(blob);
        const previousPreviewUrl = previewUrlRef.current;
        previewUrlRef.current = nextPreviewUrl;
        onPreviewChange(nextPreviewUrl);
        if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
      },
      mimeType,
      mimeType === "image/jpeg" ? 0.86 : undefined,
    );
  }, [crop, file.type, finalHeight, finalWidth, image, onPreviewChange]);

  async function apply() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setEditorError(null);
    const mimeType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? 0.9 : undefined),
    );
    if (!blob) {
      setEditorError("This image could not be processed. Try another JPEG or PNG file.");
      return;
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      setEditorError(
        `The edited image is ${(blob.size / 1024 / 1024).toFixed(1)} MB. Choose a smaller output width so it fits the 2 MB upload limit.`,
      );
      return;
    }
    const extension = mimeType === "image/jpeg" ? "jpg" : "png";
    const stem = file.name.replace(/\.[^.]+$/, "");
    await onApply(
      new File([blob], `${stem}-edited.${extension}`, { type: mimeType }),
    );
  }

  return (
    <section
      className="mt-3 rounded-md border bg-surface-raised p-4"
      aria-label="Crop and resize image"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-md border bg-surface-inset p-2">
            {image && crop ? (
              <div className="relative inline-block max-w-full overflow-hidden leading-none">
                <NextImage
                  ref={imageRef}
                  src={image.src}
                  alt="Image being cropped"
                  width={image.naturalWidth}
                  height={image.naturalHeight}
                  unoptimized
                  draggable={false}
                  className="block h-auto max-h-[420px] max-w-full select-none"
                />
                <div
                  className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_9999px_rgb(0_0_0_/_0.58)]"
                  style={{
                    left: `${(crop.x / image.naturalWidth) * 100}%`,
                    top: `${(crop.y / image.naturalHeight) * 100}%`,
                    width: `${(crop.width / image.naturalWidth) * 100}%`,
                    height: `${(crop.height / image.naturalHeight) * 100}%`,
                  }}
                >
                  <div className="absolute inset-x-0 top-1/3 border-t border-white/55" />
                  <div className="absolute inset-x-0 top-2/3 border-t border-white/55" />
                  <div className="absolute inset-y-0 left-1/3 border-l border-white/55" />
                  <div className="absolute inset-y-0 left-2/3 border-l border-white/55" />
                  <button
                    type="button"
                    className="pointer-events-auto absolute inset-3 cursor-move touch-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                    aria-label="Move crop selection. Use arrow keys for precise movement."
                    onPointerDown={beginMove}
                    onPointerMove={continueInteraction}
                    onPointerUp={endInteraction}
                    onPointerCancel={endInteraction}
                    onKeyDown={moveWithKeyboard}
                  />
                  {CROP_CORNERS.map((corner) => (
                    <button
                      key={corner.value}
                      type="button"
                      className={`pointer-events-auto absolute size-5 touch-none rounded-sm border-2 border-primary bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${corner.className}`}
                      aria-label={`${corner.label}. Use arrow keys for precise resizing.`}
                      onPointerDown={(event) => beginResize(event, corner.value)}
                      onPointerMove={continueInteraction}
                      onPointerUp={endInteraction}
                      onPointerCancel={endInteraction}
                      onKeyDown={(event) => resizeWithKeyboard(event, corner.value)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Opening image…</p>
            )}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Drag inside the frame to move it. Drag a corner handle to resize it.
          </p>
          <canvas ref={canvasRef} aria-hidden="true" className="hidden" />
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Crop ratio</Label>
            <div
              className="mt-2 grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Crop ratio"
            >
              {ASPECTS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={aspect === option.value ? "secondary" : "outline"}
                  role="radio"
                  aria-checked={aspect === option.value}
                  onClick={() => selectAspect(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">
            Output width
            <select
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={outputWidth}
              onChange={(event) => setOutputWidth(Number(event.target.value))}
            >
              {OUTPUT_WIDTHS.map((width) => (
                <option key={width} value={width}>
                  {width} px
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Output: {finalWidth} × {finalHeight} px. Images are never enlarged beyond their cropped size.
          </p>
          {editorError ? (
            <p className="text-sm text-destructive" role="alert">
              {editorError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy || !image}
              onClick={() => void apply()}
            >
              {busy ? "Uploading…" : "Crop and upload"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
