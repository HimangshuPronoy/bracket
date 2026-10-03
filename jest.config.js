/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      // Bracket engine: pure TS, no RN — esbuild for zero-overhead transpile
      displayName: 'bracket-engine',
      testMatch: ['**/__tests__/bracket.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['esbuild-jest', {
          sourcemap: true,
          loaders: { '.ts': 'ts' },
          target: 'node18',
        }],
      },
    },
    {
      // React Native / Expo components
      displayName: 'expo',
      testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '!**/__tests__/bracket.test.ts'],
      preset: 'jest-expo',
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*)',
      ],
    },
  ],
};
