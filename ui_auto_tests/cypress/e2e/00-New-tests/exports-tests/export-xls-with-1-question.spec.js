 /// <reference types="cypress" /> 

import { apiClientHelper  } from "../../../helpers/apiHelper";
import { XSLXHelper       } from "../../../helpers/xslxHelper";

import { ListOfSurveyPage } from "../../pom/projectListPage";
import { SurveyDetailPage } from "../../pom/surveyPage";


describe("Can export project to XLS And validate question's responses", () => {
    
    before(() => {  // login       
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {            
            cy.login($acct, 'super_admin')
        })

        // //Assume survey exists and is accessible to the user: Need to import a survey with 1 question
        // OR create Before to load it into the database

    })//Before All tests: user have to log in to perform actions

    before( function() {
        this.surveyListPage = new ListOfSurveyPage();
        this.surveyDetailPage = new SurveyDetailPage();

        this.serveyName = "survey 1";
        this.questionTitle = 'Quel est votre nom et prénom ';
        this.uuidTitle = '_uuid';
        this.expectedResponse = "bello osseni t";     

        cy.log(`// Given the survery/form "Survey 1" exists`);
        this.surveyListPage.OpenSurveyByName(this.serveyName);

        cy.log(`// And the Data sub page is opened`);
        this.surveyDetailPage.openSurveySubPageByName("data");

        cy.log(`// When the user export the "Survey 1" in 'XLS' format with 1 question`);
        this.surveyDetailPage.exportSurveyinFormat('XSL', this.questionTitle).then( aFileName => {
            this.exportedFileName = aFileName;
        }) ;

    }) //Before All tests: Validation contexts preparations


    //* ************************************************ */
    //* *************** TESTS SECTION ***************** */
    //* ************************************************ */

    it('User can export a form in XLS, ', function() {
        cy.log(`// Then the user export the "Survey 1" in 'XLS' format with 1 question`);
        this.surveyDetailPage.shouldHaveBeenExported(this.exportedFileName); 

        cy.log(`_uuid: ${this.expectedUuidPattern}`);
    })

    it('User can validate questions and responses within downloaded form, ', function() {
        const impportedXlsxToJson = XSLXHelper.convertXslxToJson(this.exportedFileName, this.serveyName);
        
        const jsonFile = `${this.serveyName}.json`;
        cy.log(`jsonFile: ${jsonFile} `);

        cy.fixture(jsonFile).then((testData) => {

            testData.forEach((dataRow) => {
                const dataValues = { ResponseValue: dataRow[this.questionTitle], _uuidValue: dataRow[this.uuidTitle] };

                cy.log(`Response: ${dataValues.ResponseValue} , _uuid: ${dataValues._uuidValue}`);
                cy.log(`_uuid: ${this.expectedUuidPattern}`);

                expect(dataValues.ResponseValue).to.equal(this.expectedResponse)
                expect(dataValues._uuidValue).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            });
        }) 

    })

    after(() => {
        cy.log("Need to remove the surveys/forms and users if they will be required for another tests!")
    })
});