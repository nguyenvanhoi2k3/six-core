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
  // Cho ESModule
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

  // Cho Node.js hoặc bundler
  {
    input: 'index.ts',
    output: {
      file: 'dist/six-core.umd.min.js',
      format: 'umd',
      name: 'six',
      sourcemap: true,
    },
    plugins,
    external: [],
  },

  // Cho CDN/browser
  {
    input: 'index.ts',
    output: {
      file: 'dist/six-core.iife.min.js',
      format: 'iife',
      name: 'six',
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
