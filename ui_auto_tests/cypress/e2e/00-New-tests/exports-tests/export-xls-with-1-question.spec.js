 /// <reference types="cypress" /> 

describe('Can export project tp XLS.', () => {
    before(() => {
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {
            cy.login($acct, 'super_admin')
        })
    })

    it('In order to export a form in XLS, user should exist', () => {
        cy.log("In the Export first test")
    })


});