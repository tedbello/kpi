
export class SurveyDetailPage {

    /** **/
    constructor() {       
    }

    PAGE_SELECTORS = {
        summarySubPage_Link:  () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(1)'),
        FormSubPage_Link:     () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(2)'),
        DataSubPage_Link:     () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(3)'),
        SettingsSubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(4)')  
    }


    openSurveySubPageByName(name){
        cy.waitUntilLoadingSpinnerToFinish();

        switch (name.toLowerCase().trim()) {
            case 'summary': this.PAGE_SELECTORS.summarySubPage_Link().click();  break;
            case 'form':    this.PAGE_SELECTORS.FormSubPage_Link().click();     break;
            case 'data':    this.PAGE_SELECTORS.DataSubPage_Link().click();     break;
            case 'setting': this.PAGE_SELECTORS.SettingsSubPage_Link().click(); break;        
            default: break;
        }

        cy.waitForSpinnerToDisappear();
    }

    //Methode to export servey based on format provided
    exportSurveyinFormat(formatType){
        const dataSubPage = new SurveyDetailPage.SurveyDataPage();        
        dataSubPage.Export(formatType);
    }

    static SurveyDataPage =  class {
        constructor(){}

        PAGE_SELECTORS = {
            Table_Link: () => cy.getByTextContent('Table'),
            Reports_Link: () => cy.getByTextContent('Reports'),
            Gallery_Link: () => cy.getByTextContent('Gallery'),
            Download_Link: () => cy.getByTextContent('Download'),
            Map_Link: () => cy.getByTextContent('Map'),

            DownloadTitle: () => cy.getByDocumentSelector('form-view__cell--page-title').getByTextContent('Downloads'),
            SelectExportType_Ddown: () => cy.getByTextContent('Select export type').getByDocumentSelector('kobo-select__value-container'),
            //ValueAndHeaderFormat_Ddown
        }

        Export(format){
            this.PAGE_SELECTORS.Download_Link().click();
            cy.waitUntilLoadingSpinnerToFinish();
            this.PAGE_SELECTORS.SelectExportType_Ddown().click();
            cy.wait(10000);
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
