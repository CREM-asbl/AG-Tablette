/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  plugins: ['@snowpack/plugin-babel', '@snowpack/plugin-dotenv', 'babel-plugin-root-import'],
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    /* Example: Bundle your final build: */
    // "bundle": true,
  },
  packageOptions: {
    source: "remote-next",
    knownEntrypoints: [
      "lit-element/lit-element.js"
    ]
  },
  devOptions: {
    port: 8000,
    open: "chrome"
  },
  buildOptions: {
    /* ... */
  },
};
