const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here

      on('task', {
        readXlsxFile({ filePath, sheetName }) {
            const workbook = XLSX.readFile(filePath);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            return jsonData; // Return the JSON data
        },

        writeJsonFile({ filePath, jsonData }) {
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 4), 'utf-8');
            return null; // Return null to indicate completion
        }
      });
    },

    //video: true,

    baseUrl: 'http://kf.kobo.local/',
    watchForFileChanges:false,
    defaultCommandTimeout: 6000,

    specPattern: ['cypress/e2e/**/*.spec.{js,jsx,ts,tsx}']
  },
});
