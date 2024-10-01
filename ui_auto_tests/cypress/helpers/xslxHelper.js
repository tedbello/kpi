import { writeFileSync } from "fs";
import * as XLSX from "xlsx";

export class XSLXHelper {
    
    constructor(jsonObject) {
        this.jsonObject = jsonObject;
    }

    // Method to get a JSON object based on element name
    static convertXslxToJson(aFile, workshitName) {
        //Access the filename stored in the test context or passed externally
        const filePath = `./cypress/downloads/${aFile}`;
        cy.log(`File to be processed: ${filePath}`);

        // Call the readXlsxFile task to convert the worksheet to JSON
        cy.task('readXlsxFile', { filePath, sheetName: workshitName.toLowerCase() }).then((jsonData) => {
            
            // Call the writeJsonFile task to save the converted data as a JSON file
            const jsonFilePath = `./cypress/fixtures/${workshitName}.json`;
            cy.task('writeJsonFile', { filePath: jsonFilePath, jsonData }).then(() => {
            cy.log(`JSON file written to: ${jsonFilePath}`);
            });
        });
    
        
    }

} //  XSLXHelper

