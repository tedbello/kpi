// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import { createAnAccountPage } from '../e2e/pom/createAnAccountPage';
import { ListOfSurveyPage } from '../e2e/pom/projectListPage';
import { NewProjectSettingModal } from '../e2e/pom/newProjectModalPage';


Cypress.Commands.add('setupDatabase', () => {
    cy.log('setupDatabase not functional')
})

Cypress.Commands.add('getByDataCy', (selector) => {
    return cy.get(`[data-cy=${selector}]`)
})

Cypress.Commands.add('getByDocumentSelector', (selector) => {
    return cy.get(`${selector}`)
})

Cypress.Commands.add('getByTextContent', (text) => {
    return cy.contains(`${text}`)
})

Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
    cy.log('Waiting for an element to complete and page to load ...');
    let interval = 1000; // Check every 1 second
    let maxRetries = timeout / interval;
    let retries = 0;

    function checkElement() {
        cy.get('body').then(($body) => {
            if ($body.find(selector).length > 0) {
                cy.get(selector).scrollIntoView().should('be.visible'); // Element exists, proceed
            }
            else if (retries < maxRetries) {
                // Log the remaining time
                let remainingTime = (maxRetries - retries) * interval / 1000;
                cy.log(`Waiting for element. Time remaining is: ${remainingTime} seconds`);
                retries++;
                // Retry after interval
                cy.wait(interval).then(checkElement);
            }
            else {
                throw new Error(`Element with ${selector} did not appear within ${timeout / 1000} seconds`);
            }
        });
    }

    checkElement();
});

Cypress.Commands.add('waitForSpinnerToDisappear', (maxAttempts = 10, attempt = 1) => {
    cy.log('Waiting for the page to load ...');
    cy.get('body').then($body => {
        if ($body.find('.k-spin').length > 0) {
            if (attempt >= maxAttempts) {
                throw new Error(`Spinner with selector "${'.k-spin'}" did not disappear after ${maxAttempts} attempts.`);
            }
            cy.wait(2000);
            cy.waitForSpinnerToDisappear(maxAttempts, attempt + 1);
        }
    });
});

Cypress.Commands.add('waitUntilLoadingSpinnerToFinish', () => {
    cy.log('Waiting for the page to load ...');
    cy.getByDocumentSelector('.k-spin', { timeout: 3000 })
        .then($spinner => {
            if ($spinner.is(':visible')) {
                cy.wait(500);
                cy.getByDocumentSelector('.k-spin', { timeout: 3000 }).should('not.exist');
            }
            else
                cy.waitUntilLoadingSpinnerToFinish();

        })
})

Cypress.Commands.add('login', (account, name) => {
    cy.visit('/accounts/login/')
    cy.getByDocumentSelector('input[name="login"]').type(name)
    cy.getByDocumentSelector('input[name="password"]').type(account.password)
    cy.getByDocumentSelector('button[type="submit"]').click()

    cy.waitUntilLoadingSpinnerToFinish();
})

Cypress.Commands.add('openMenu', () => {
    cy.getByDocumentSelector('button[class*="mainHeader-module" ]').click();
    cy.wait(2000);
})

Cypress.Commands.add('createTestProject', (title) => {
    const listOfProjectsPage = new ListOfSurveyPage();
    listOfProjectsPage.createNewProject();

    const newProjectModal = new NewProjectSettingModal();
    newProjectModal.createProjectByTypeName('Build from scratch');

    newProjectModal.fillInProjectTitle(title);
    newProjectModal.fillInProjectDescription('This form was created by a bot.');
    newProjectModal.selectProjectSector('Other');
    newProjectModal.selectProjectCountry('United States');

    newProjectModal.submitCreateNewProject();

    cy.url().should('include', '/edit')

    cy.getByDocumentSelector('.left-tooltip > .k-icon').click() // Go bak to list of projects
    cy.waitForSpinnerToDisappear();
})

Cypress.Commands.add('addQuestionsToForm', (formTitle, data) => {
    const listOfProjectsPage = new ListOfSurveyPage();
    const surveyDetailPage = new SurveyDetailPage();
    const formQuestionsPage = new FormQuestionsPage();

    listOfProjectsPage.openSurveyByName(formTitle);
    surveyDetailPage.openSurveySubPageByName('SUMMARY');
    surveyDetailPage.isFormSubPageByNameOpened('SUMMARY');
    surveyDetailPage.editFormFrom('SUMMARY');

    formQuestionsPage.addAquestion(data);

    listOfProjectsPage.openSurveyByName(formTitle);
    surveyDetailPage.openSurveySubPageByName('SUMMARY');
    surveyDetailPage.isFormSubPageByNameOpened('SUMMARY');
})



Cypress.Commands.add('deleteTestProject', (title) => {
    const surveyListPage = new ListOfSurveyPage();
    surveyListPage.deleteAProjectByName(title);
})

Cypress.Commands.add('selectNewProjectType', (type) => {

    cy.log('selecting "Build project from scratch"');

    switch (type.toLowerCase()) {
        case 'build from scratch': cy.getByDocumentSelector('.form-modal__item > :nth-child(1)').click(); break;//        
        case 'use a template': cy.getByDocumentSelector('.form-modal__item > :nth-child(2)').click(); break;; //
        case 'upload an xslform': cy.getByDocumentSelector('.form-modal__item > :nth-child(3)').click(); break;; //
        case 'import an xslform via url': cy.getByDocumentSelector('.form-modal__item > :nth-child(4)').click(); break;; //    
    }
    cy.wait(1500);
})


// Makes this case insensitive by default
Cypress.Commands.overwriteQuery('contains', (originalFn, subject, filter, text, options = {}) => {
    // determine if a filter argument was passed
    if (typeof text === 'object') {
        options = text
        text = filter
        filter = undefined
    }

    options.matchCase ??= false

    return originalFn(subject, filter, text, options)
}
)