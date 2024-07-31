
describe('super_admin can create New Project.', function () {
    before(() => {
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {
            cy.login($acct, 'super_admin')
        })
    })

it('Creates a Form', function () {

    cy.contains('NEW').should('exist')

});