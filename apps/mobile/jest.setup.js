/* eslint-env jest */
/* Native modules are mocked: unit tests cover pure logic (no device, no network). */
jest.mock('react-native-sound', () => {
  class Sound {
    static setCategory = jest.fn();
    constructor(_uri, _base, cb) {
      setTimeout(() => cb && cb(undefined), 0);
    }
    play = jest.fn();
    pause = jest.fn();
    stop = jest.fn();
    release = jest.fn();
  }
  return { __esModule: true, default: Sound };
});
jest.mock('react-native-tts', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getInitStatus: jest.fn(() => Promise.resolve('success')),
    voices: jest.fn(() => Promise.resolve([])),
    setDefaultVoice: jest.fn(() => Promise.resolve('success')),
    speak: jest.fn(),
    stop: jest.fn(() => Promise.resolve(true)),
    requestInstallData: jest.fn(() => Promise.resolve('success')),
  },
}));
jest.mock('react-native-config', () => ({ __esModule: true, default: {} }));
jest.mock('@op-engineering/op-sqlite', () => ({ open: jest.fn() }));
jest.mock('@dr.pogodin/react-native-fs', () => ({ DocumentDirectoryPath: '/docs' }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => () => {}) },
}));
