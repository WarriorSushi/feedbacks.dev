import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const cssPlugin = {
  name: 'inline-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, (args) => {
      const css = readFileSync(args.path, 'utf8');
      // Minify CSS by collapsing whitespace
      const minified = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
      return {
        contents: `export default ${JSON.stringify(minified)};`,
        loader: 'js',
      };
    });
  },
};

/** @type {esbuild.BuildOptions} */
const widgetConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: 'es2020',
  format: 'iife',
  globalName: 'FeedbacksWidgetRuntime',
  outfile: 'dist/widget.js',
  plugins: [cssPlugin],
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

/** @type {esbuild.BuildOptions} */
const captureConfig = {
  entryPoints: ['src/capture-renderer.ts'],
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: 'es2020',
  format: 'esm',
  outfile: 'dist/capture.mjs',
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

if (isWatch) {
  const [widgetContext, captureContext] = await Promise.all([
    esbuild.context(widgetConfig),
    esbuild.context(captureConfig),
  ]);
  await Promise.all([widgetContext.watch(), captureContext.watch()]);
  console.log('[widget] watching for changes...');
} else {
  const [widgetResult, captureResult] = await Promise.all([
    esbuild.build({ ...widgetConfig, metafile: true }),
    esbuild.build({ ...captureConfig, metafile: true }),
  ]);
  const text = await esbuild.analyzeMetafile(widgetResult.metafile);
  const captureText = await esbuild.analyzeMetafile(captureResult.metafile);
  console.log(text);
  console.log(captureText);
  console.log('[widget] build complete');
}
