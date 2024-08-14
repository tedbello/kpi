const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },

    baseUrl: 'http://kf.kobo.local/',
    watchForFileChanges:false,
    defaultCommandTimeout: 6000,

    specPattern: ['cypress/e2e/**/*.spec.{js,jsx,ts,tsx}']
  },
});
