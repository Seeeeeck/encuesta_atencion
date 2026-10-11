export default {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^(\\.{1,2}/)+entorno$': '<rootDir>/src/__mocks__/entorno.ts',
  },
  // react-router v8 y sus dependencias solo se publican como ESM (.js/.mjs):
  // hay que pasarlos por Babel para que Jest (CommonJS) los pueda cargar.
  transform: { '\\.(m?js|jsx|ts|tsx)$': 'babel-jest' },
  transformIgnorePatterns: ['/node_modules/(?!(react-router|@remix-run|cookie-es)/)'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
};
