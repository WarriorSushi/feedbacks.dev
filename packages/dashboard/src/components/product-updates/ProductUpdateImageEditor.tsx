"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  calculateProductUpdateCrop,
  calculateProductUpdateOutput,
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

export function ProductUpdateImageEditor({
  file,
  busy,
  onCancel,
  onApply,
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [aspect, setAspect] = React.useState<ProductUpdateImageAspect>("16:9");
  const [focalX, setFocalX] = React.useState(50);
  const [focalY, setFocalY] = React.useState(50);
  const [outputWidth, setOutputWidth] = React.useState(1280);
  const [editorError, setEditorError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.onload = () => {
      setEditorError(null);
      setImage(nextImage);
    };
    nextImage.onerror = () =>
      setEditorError("This image could not be opened. Choose a valid JPEG or PNG file.");
    nextImage.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const crop = image
    ? calculateProductUpdateCrop(
        image.naturalWidth,
        image.naturalHeight,
        aspect,
        focalX,
        focalY,
      )
    : null;
  const output = crop
    ? calculateProductUpdateOutput(crop, outputWidth)
    : { width: outputWidth, height: Math.round(outputWidth / (16 / 9)) };
  const finalWidth = output.width;
  const finalHeight = output.height;

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
  }, [crop, finalHeight, finalWidth, image]);

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
        <div className="overflow-hidden rounded-md border bg-surface-inset p-2">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Cropped image preview"
            className="h-auto max-h-[360px] w-full object-contain"
          />
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
                  onClick={() => setAspect(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">
            Horizontal crop position
            <input
              className="mt-2 w-full accent-primary"
              type="range"
              min="0"
              max="100"
              value={focalX}
              onChange={(event) => setFocalX(Number(event.target.value))}
            />
          </label>
          <label className="block text-sm font-medium">
            Vertical crop position
            <input
              className="mt-2 w-full accent-primary"
              type="range"
              min="0"
              max="100"
              value={focalY}
              onChange={(event) => setFocalY(Number(event.target.value))}
            />
          </label>
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
