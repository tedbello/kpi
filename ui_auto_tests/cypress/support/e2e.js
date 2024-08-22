// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Cypress.on('uncaught:exception', (err, runnable) => {
//   // returning false here prevents Cypress from
//   // failing the test
//   return false
// })

before(() => { // run once before all tests
    cy.setupDatabase()
})

before('Creating test accounts', () => { 
    cy.fixture(user_accounts)
    .then(users => {
        users.forEach(user => {
            cy.log(`fullName:${user.fullName} - username: ${user.username} - email": ${user.email}" - password: ${user.password}`);
            //cy.CreateTestUser_api(user); //Rest call
            //cy.CreateTestUser_ui(user); //Cypress function in commands.js
        });
    })
})

After('Delete users', () => {
    //Rest api possible
    // UI - Cypress function in command.js
});

afterEach(() => { // run after every test
    cy.log('Test complete.')
})