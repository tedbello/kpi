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


// before(() => { // run once before all tests
//     cy.setupDatabase()
// })

before('Setup: Creating test accounts', () => { 
    cy.viewport(1280, 720);
    cy.fixture('user_accounts')
    .then(users => {
        users.forEach(user => {
            cy.log(`-> fullName:${user.fullname} -> username: ${user.username} -> email: ${user.email} -> password: ${user.password}`);

            //By Rest call (HOWTO? ASK JNM)
            //cy.addNewAccount_api(user);

            //By UI  (See in commands.js)
            cy.addNewAccount_ui(user); 
        });
    })
})

// // After('Delete users', () => {
// //     //Rest api possible
// //     // UI - Cypress function in command.js
// // });

afterEach(() => { // run after every test
    cy.log('Test complete.')
})