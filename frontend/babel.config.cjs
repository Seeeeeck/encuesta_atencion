// Babel solo lo usa Jest (Vite compila con su propio plugin).
// Jest corre en CommonJS, donde `import.meta` no existe: lo reemplaza por un objeto vacío.
// Hace falta para paquetes que solo se publican como ESM, como react-router v8.
const reemplazarImportMeta = () => ({
  visitor: {
    MetaProperty(path) {
      if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
        path.replaceWithSourceString('({ env: {} })');
      }
    },
  },
});

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [reemplazarImportMeta],
};
