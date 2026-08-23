import { snapdom } from '@zumer/snapdom';

const WIDGET_CAPTURE_EXCLUDE = '[data-feedbacks-capture-exclude="true"]';

export async function captureVisibleViewport(root: Element): Promise<HTMLCanvasElement> {
  return snapdom.toCanvas(root, {
    clip: 'viewport',
    dpr: 1,
    fast: true,
    compress: true,
    embedFonts: true,
    placeholders: true,
    exclude: [WIDGET_CAPTURE_EXCLUDE],
    excludeMode: 'hide',
    pictureResolver: {
      timeout: 2_500,
      concurrency: 4,
      silent: true,
    },
  });
}
