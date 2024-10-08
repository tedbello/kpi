export class FormQuestionsPage {

    /** **/
    constructor() { }

    PAGE_SELECTORS = {
        addQuestionPlusSign_btn: () => cy.getByDataCy('plus'),
        questionInput_txtF: () => cy.getByDataCy('textfield_input'),
        addQuestion_btn: () => cy.getByDataCy('add_question'),
        questionsTypeItems_list: (menuItem) => cy.getByDocumentSelector('[data-menu-item="' + menuItem + '"]'),
        questionAddOptions_btn: () => cy.getByDataCy('add_option'),
        questionOption: () => cy.getByDataCy('option'),

        saveQuestion_btn: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("save")'),
        goBackToListOfProject_btn: () => cy.getByDocumentSelector('[data-tip="Return to list"]'),

        editedFormContainer: () => cy.getByDocumentSelector('.survey-editor.form-editor-wrap ul'),
    }


    addAquestion(data) {
        this.PAGE_SELECTORS.editedFormContainer().should('be.visible');

        for (const question in data) {
            cy.log(`${question}: ${data[question]}`)

            this.PAGE_SELECTORS.addQuestionPlusSign_btn().click();
            this.PAGE_SELECTORS.questionInput_txtF().type(question);
            this.PAGE_SELECTORS.addQuestion_btn().click();
            this.PAGE_SELECTORS.questionsTypeItems_list(data[question].menu_item).click();

            if (data[question].hasOwnProperty('options')) {
                for (let i = 0; i < data[question].options.length - 2; i++) {
                    this.PAGE_SELECTORS.questionAddOptions_btn().should('have.length', 1).click();
                }

                this.PAGE_SELECTORS.questionOption()
                    .each(($opt, index) => {
                        cy.wrap($opt)
                            .click()
                            .then(() =>
                                cy.wrap($opt)
                                    .clear()
                                    .type(data[question].options[index])
                            )
                    })
            }
            this.PAGE_SELECTORS.saveQuestion_btn().click();

            cy.get('.go3958317564', { timeout: 2000 }).should('be.visible').and('contain', 'successfully updated');
            cy.wait(3000);
            cy.get('.go3958317564').should('not.be.visible');
        }

        this.PAGE_SELECTORS.goBackToListOfProject_btn().click({ timeout: 2000 });
        cy.waitForSpinnerToDisappear();
    }


}//CLASS