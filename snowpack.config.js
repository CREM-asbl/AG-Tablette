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
      "lit-element/lit-element.js",
      "@lit/reactive-element/decorators/custom-element.js",
      "@lit/reactive-element/decorators/property.js",
      "@lit/reactive-element/decorators/state.js",
      "@lit/reactive-element/decorators/event-options.js",
      "@lit/reactive-element/decorators/query.js",
      "@lit/reactive-element/decorators/query-all.js",
      "@lit/reactive-element/decorators/query-async.js",
      "@lit/reactive-element/decorators/query-assigned-nodes.js"
    ]
  },
  devOptions: {
    port: 8000,
    open: "none"
  },
  buildOptions: {
    /* ... */
  },
};
