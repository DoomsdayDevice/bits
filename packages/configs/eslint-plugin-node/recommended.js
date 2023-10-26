module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  // root: true,
  rules: {
    // OFF
    'no-shadow': 'off',

    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'import/prefer-default-export': 'off',
    'no-await-in-loop': 'off',
    'implicit-arrow-linebreak': 'off', // ['error', 'beside'],
    '@typescript-eslint/no-non-null-assertion': 'off',
    'operator-linebreak': 'off', // ['error', 'before', { overrides: { '=': 'ignore' } }],
    'function-paren-newline': 'off', // 'off', //['error', 'consistent'],
    // TEMPORARILY OFF
    'import/no-unresolved': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-useless-constructor': 'off',
    'no-unused-vars': 'off',
    'no-empty-function': 'off',
    // 'no-redeclare': 'off',

    // adjustments
    '@typescript-eslint/no-shadow': ['error'],
    'no-use-before-define': 'off', // ['error', { classes: false, variables: true, functions: false }],
    'arrow-parens': ['error', 'as-needed'],
    'comma-style': ['error', 'last', { exceptions: { ArrayExpression: true } }],
    'no-underscore-dangle': [
      'error',
      {
        allow: [
          '_id',
          '_type',
          '_value',
          '_eq',
          '_ne',
          '_isNull',
          '_in',
          '_nin',
          '_regex',
          '_lt',
          '_lte',
          '_gt',
          '_gte',
          '_or',
          '_and',
          '_readRepo',
          '_writeRepo',
        ],
        allowAfterThis: false,
        allowAfterSuper: false,
        enforceInMethodNames: true,
      },
    ],
    'object-curly-newline': 'off',
    // 'max-len': [
    //   'error',
    //   100,
    //   2,
    //   {
    //     ignoreUrls: true,
    //     ignoreComments: false,
    //     ignoreRegExpLiterals: true,
    //     ignoreStrings: true,
    //     ignoreTemplateLiterals: true,
    //   },
    // ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        js: 'never',
        mjs: 'never',
        jsx: 'never',
      },
    ],
    // 'import/no-restricted-paths': [
    //   'error',
    //   {
    //     zones: [
    //       { target: './libs/bits', from: './libs/bits/graphql' },
    //       { target: './libs/bits', from: '@bits/graphql' },
    //     ],
    //   },
    // ],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: 'returns|type|of' }],
    'max-classes-per-file': ['error', 99],

    // default
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // 'prettier/prettier': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue'],
      },
    },
  },
  ignorePatterns: ['libs/**/*.ts'],
};
