
export class ListOfSurveyPage {

    /** **/
    constructor() {       
    }

    PAGE_SELECTORS = {
        projectTable:  () => cy.getByDocumentSelector ('div[class*=projectsTable-module__body-] > div'),
        listOfSurveys: () => cy.getByDataCy('asset')
    }

    OpenSurveyByName(name){        
        this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`).click();
    }
}//Class