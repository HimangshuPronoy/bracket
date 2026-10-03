/** @type {import('jest').Config} */
module.exports = {
  displayName: 'bracket-engine',
  testMatch: ['<rootDir>/__tests__/bracket.test.ts'],
  testEnvironment: 'node',
  // Disable Haste module system (RN preset enables it, which crawls node_modules forever)
  haste: undefined,
  resolver: undefined,
  transform: {
    '^.+\\.tsx?$': ['babel-jest', {
      presets: ['babel-preset-expo'],
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Don't use root jest.config.js at all
  rootDir: '.',
};
