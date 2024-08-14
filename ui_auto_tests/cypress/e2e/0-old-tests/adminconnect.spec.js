 /// <reference types="cypress" /> 

import {NewProjectModal} from "../pom/newProjectModalPage";


describe('super_admin can create New Project.', function () {
    before(() => {
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {
            cy.login($acct, 'super_admin')
        })
    })

    it('Creates a new project from scratch', function () {
        cy.openMenu();
        cy.CreateNewProject('Build from scratch');     
    })

});