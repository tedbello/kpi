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

//const { NewProjectModal } = require("../e2e/pom/newProjectModalPage")

import {createAnAccountPage} from '../e2e/pom/createAnAccountPage';


Cypress.Commands.add('setupDatabase', () => {
    cy.log('setupDatabase not functional')
})

Cypress.Commands.add('getByDataCy', (selector) => {
    return cy.get(`[data-cy=${selector}]`)
})

Cypress.Commands.add('getByDocumentSelector', (selector) => {
    return cy.get(`${selector}`)
})

Cypress.Commands.add('addNewAccount_ui', (user) => {
    cy.visit('/accounts/login/');

    const newAccountPage = new createAnAccountPage();
    //newAccountPage.createNewAccount(user); // Need to delete account before recreate it

    // NEED TO DELETE AND RECREATE ACCOUNT IN ORDER TO CONFIRM
    //DEBUG
    //cy.visit('/accounts/confirm-email/'); 
    // cy.url('pathname').should('include', '/accounts/confirm-email/');
    // cy.get('h1').should('be.visible').and('have.text','Confirm your email address');
    // cy.get('p.registration__message--complete').should('contain', 'Please click the activation link in the email just sent to you.')
})


Cypress.Commands.add('login', (account, name) => {
    cy.visit('/accounts/login/')
    cy.getByDocumentSelector('input[name="login"]').type(name)
    cy.getByDocumentSelector('input[name="password"]').type(account.password)
    cy.getByDocumentSelector('button[type="submit"]').click()
})

Cypress.Commands.add('openMenu', () => {
    cy.getByDocumentSelector('button[class*="mainHeader-module" ]').click();
    cy.wait(2000);
})

Cypress.Commands.add('createNewProject', () => { 
    cy.log('Click "NEW" button to create a new project');
    cy.getByDocumentSelector('.form-sidebar-wrapper > .k-button').click(); // NEW Button

    cy.url('pathname').should('include', '/#/projects/home')    
})

Cypress.Commands.add('selectNewProjectType', (type) => { 

    cy.log('selecting "Build project from scratch"');
    
    switch (type.toLowerCase()) {
        case 'build from scratch':        cy.getByDocumentSelector('.form-modal__item > :nth-child(1)').click(); break;//        
        case 'use a template':            cy.getByDocumentSelector('.form-modal__item > :nth-child(2)').click(); break;; //
        case 'upload an xslform':         cy.getByDocumentSelector('.form-modal__item > :nth-child(3)').click(); break;; //
        case 'import an xslform via url': cy.getByDocumentSelector('.form-modal__item > :nth-child(4)').click(); break;; //    
    }
    cy.wait(3000); //debug
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