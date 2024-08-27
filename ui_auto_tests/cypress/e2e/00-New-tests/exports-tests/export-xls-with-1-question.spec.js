 /// <reference types="cypress" /> 

import {ListOfSurveyPage} from "../../pom/projectListPage";
import {SurveyDetailPage} from "../../pom/surveyPage";


describe('Can export project tp XLS.', () => {
    before(() => {
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {
            cy.login($acct, 'super_admin')
        })

        //Assume survey exists and is accessible to the user: Need to import a survey with 1 question
        // OR create Before to load it into the database
    })

    it.only('User can export a form in XLS, ', () => {
        cy.log(`Scenarios:
                Given the survery/form Survey_1 exists
                When the user export the servey in 'XLS' format
                Then the survey should have been downloaded`);

        const surveyListPage = new ListOfSurveyPage();
        const surveyDetailPage = new SurveyDetailPage();

        //Given the survery/form "Survey 1" exists
        surveyListPage.OpenSurveyByName("survey 1");
        surveyDetailPage.openSurveySubPageByName("data");

        //When the user export the servey in 'XLS' format
        surveyDetailPage.exportSurveyinFormat('XSL');

        //Then the form should have been downloaded 
    })


    it('User can validate questions and responses within downloaded form, ', () => {
        cy.log(`Steps: \n
                Given the survery/form Survey_2 exists \n
                And has been download \n
                When the user opens the download survey \n
                Then he should see 2 column in the file with titles 'Questions' and '_uuid' \n
                And he should see the response '???' under the 'question' column \n
                And He should see the response '/blank/ ' under the '_uuid' columne`)
    })

    after(() => {
        cy.log("Need to remove the surveys/forms and users if they will be required for another tests!")
        }
    )


});