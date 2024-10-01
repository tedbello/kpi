require('cypress-downloadfile/lib/downloadFileCommand');

export class SurveyDetailPage {

    dataSubPage;
    /** **/
    constructor() { 
        this.dataSubPage = new SurveyDetailPage.SurveyDataPage();  
    }

    PAGE_SELECTORS = {
        summarySubPage_Link:  () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(1)'),
        FormSubPage_Link:     () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(2)'),
        DataSubPage_Link:     () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(3)'),
        SettingsSubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(4)')  
    }

    openSurveySubPageByName(name){
        switch (name.toLowerCase().trim()) {
            case 'summary': this.PAGE_SELECTORS.summarySubPage_Link().click();  break;
            case 'form':    this.PAGE_SELECTORS.FormSubPage_Link().click();     break;
            case 'data':    this.PAGE_SELECTORS.DataSubPage_Link().click();     break;
            case 'setting': this.PAGE_SELECTORS.SettingsSubPage_Link().click(); break;        
            default: break;
        }
        cy.waitForElement('div.rt-table')
    }

    //Methode to export servey based on format provided
    exportSurveyinFormat(formatType, theQuestion){     
        return this.dataSubPage.Export(formatType, theQuestion);
    }

    shouldHaveBeenExported(fileName){
        //cy.readFile(`cypress/downloads/${exportedFileName}`).should('exist');
        this.dataSubPage.isFileBeenExported(fileName);
    }


    // ----------------------  Sub Classes Sections  --------------------------

    static SurveyDataPage =  class {
        exportedFileName; 

        /** **/
        constructor() { 
            this.exportedFileName = "";      
        }

        PAGE_SELECTORS = {
            Table_Link: () => getByDocumentSelector('div.form-view__sidetabs :nth-child(1)'),
            Reports_Link: () => cgetByDocumentSelector('div.form-view__sidetabs :nth-child(2)'),
            Gallery_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(3)'),
            Download_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(4)'),
            Map_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(5)'),

            DownloadTitle: () => cy.getByDocumentSelector('form-view__cell--page-title').getByTextContent('Downloads'),
            SelectExportType_Ddown: () => cy.getByTextContent('Select export type').getByDocumentSelector('kobo-select__value-container'),
            Advanced_options: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("Advanced options")'),            
            Select_questions_to_be_exported: () => cy.getByDocumentSelector('.toggle-switch__label').filter(':contains("Select questions to be exported")'),

            Deselect_all: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("all")').eq(1),
            Questions_list: () => cy.getByDocumentSelector('ul.multi-checkbox li'),
            Export: () => cy.getByDocumentSelector('button[type="submit"]').filter(':contains("Export")'),
            Export_Download_btn: () => cy.getByDocumentSelector('table.simple-table.simple-table--project-exports tbody').find('button').eq(0),
        }

        Export(format, testQuestion){
            this.PAGE_SELECTORS.Download_Link().click();
            cy.wait(1000);
            this.PAGE_SELECTORS.Advanced_options().click();
            this.PAGE_SELECTORS.Select_questions_to_be_exported().click();
            this.PAGE_SELECTORS.Deselect_all().click({force: true});
            
            //Select 1 question
            this.PAGE_SELECTORS.Questions_list().filter(`:contains(${testQuestion})`).click();
            this.PAGE_SELECTORS.Export().click();

            cy.waitForElement('table.simple-table.simple-table--project-exports');
            cy.wait(3000);

            cy.intercept('GET', '**').as('fileDownload');  // Intercept the file download request

            // Click the download button
            this.PAGE_SELECTORS.Export_Download_btn().should('contain', 'Download').should('be.visible').click();

            // Wait for the download to complete
            return cy.wait('@fileDownload', { timeout: 10000 }).then( (interception) => {
                const downloadUrl = interception.response.url;
                cy.log(`downloadUrl : ${downloadUrl}`);

                // Return the file name using cy.wrap to make it chainable
                return cy.wrap(downloadUrl.split('/').pop()).as("exportedFileName") ;
            });

            return cy.get("@exportedFileName").then((fileName) => {
                return fileName;
            })
        }

    interceptFileTobeDownlaod() {
        cy.intercept('GET', '**').as('fileDownload');  // Intercept the file download request

        // Click the download button
        this.PAGE_SELECTORS.Export_Download_btn().should('contain', 'Download').should('be.visible').click();

        // Wait for the download to complete
        return cy.wait('@fileDownload', { timeout: 10000 }).then((interception) => {
            const downloadUrl = interception.response.url;
            cy.log(`downloadUrl : ${downloadUrl}`);         

            return downloadUrl.split('/').pop();
        });
    }

    isFileBeenExported(aFile){
        cy.readFile(`cypress/downloads/${aFile}`).should('exist');
    }

    }//surveyDataPage

    static SurveySettingsPage =  class  {
        constructor() {}
        PAGE_SELECTORS = {}
    }
    
    static SurveySummaryPage =  class  {
        constructor() {}
        PAGE_SELECTORS = {}
    }

    static SurveyFormPage =  class {
        constructor() {}
        PAGE_SELECTORS = {}
        
    }
    
} //Class SurveyPage
