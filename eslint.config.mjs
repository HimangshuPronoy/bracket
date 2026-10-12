import expo from 'eslint-config-expo/flat.js';

export default [
  ...expo,
  {
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'off',
      'react-hooks/immutability': 'off',
    },
  },
];
