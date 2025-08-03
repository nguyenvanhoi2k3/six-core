import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

const plugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false,
    declarationMap: false,
    sourceMap: true,
  }),
  terser({
    format: {
      comments: false,
    },
    compress: {
      drop_console: true,
    },
  }),
];

const config = [
  // 1️⃣ ESM Build
  {
    input: 'index.ts',
    output: {
      file: 'dist/six-core.esm.min.js',
      format: 'es',
      sourcemap: true,
    },
    plugins,
    external: [],
  },

  // 2️⃣ UMD Build for CDN (IIFE-like)
  {
    input: 'index.ts',
    output: {
      file: 'dist/six-core.umd.min.js',
      format: 'umd',
      name: 'six-core', // global name for browser
      sourcemap: true,
    },
    plugins,
    external: [],
  },

  // 3️⃣ Types (.d.ts)
  {
    input: 'index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];

export default config;
