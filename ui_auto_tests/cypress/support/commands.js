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

Cypress.Commands.add('setupDatabase', () => {
    cy.log('setupDatabase not functional')
})

Cypress.Commands.add('login', (account, name) => {
    cy.visit('/accounts/login/')
    cy.get('input[name="login"]').type(name)
    cy.get('input[name="password"]').type(account.password)
    cy.get('button[type="submit"]').click()
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