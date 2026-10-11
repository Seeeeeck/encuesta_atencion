// jsdom no trae TextEncoder/TextDecoder y react-router los usa al cargarse.
const { TextDecoder, TextEncoder } = require('node:util');

Object.assign(globalThis, { TextEncoder, TextDecoder });
