 /// <reference types="cypress" /> 

import {NewProjectSettingModal} from "../pom/newProjectModalPage";

const projectModal = new NewProjectSettingModal();

describe('super_admin can create New Project.', function () {
    before(() => {
        cy.viewport(1280, 720);
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {
            cy.login($acct, 'super_admin')
        })
    })

    it('Creates a new project from scratch', function () {
        cy.createNewProject();
        cy.selectNewProjectType('Build from scratch');
        cy.get('.modal__title').should('be.visible');
        
        cy.wait(3000) //debug    
        
        projectModal.createNewProjectwithSetting()
    })


});