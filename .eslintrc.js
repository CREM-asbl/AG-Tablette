module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:lit/recommended',
    'prettier', // Assurez-vous que c'est la dernière extension pour surcharger les autres
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'lit',
  ],
  rules: {
    // Ajoutez ici des règles ESLint spécifiques ou surchargez celles existantes si nécessaire
    // Exemple : 'no-unused-vars': 'warn'
  },
  overrides: [
    {
      files: ['.astro/**/*.js', '*.astro/*.js'],
      parser: '@typescript-eslint/parser',
    }
  ]
};
