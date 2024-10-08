
export class ListOfSurveyPage {

    /** **/
    constructor() {
    }

    PAGE_SELECTORS = {
        menu_drawer: () => cy.getByDocumentSelector("button[class*='mainHeader-module']"),
        menu_NEW: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("new")'),

        projectTable: () => cy.getByDocumentSelector('div[class*=projectsTable-module__body-] > div'),
        listOfSurveys: () => cy.getByDataCy('asset'),

        AProjectCheckboxByName: (title) => cy.getByDataCy('asset').filter(`:contains(${title})`).parent().parent().children().first(),

        archivePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(0),
        SharePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(1),
        DeletePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(2),
    }

    createNewProject() {
        this.PAGE_SELECTORS.menu_NEW().then($newBtn => {
            if ($newBtn.is(':visible')) {
                cy.wrap($newBtn).click();
            }
            else {
                this.PAGE_SELECTORS.menu_drawer().click();
                this.PAGE_SELECTORS.menu_NEW().should('be.visible').click();
            }
        })
        cy.waitForElement('div .project-settings--form-source');
    }

    openSurveyByName(name) {
        cy.document().its('readyState').should('eq', 'complete');
        this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`)
            .as('formToOpen')
            .scrollIntoView()
            .click();
    }

    projectShouldExist(name, shoulExist = true) {
        if (shoulExist)
            this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`).should('exist').and('be.visible');
        else
            this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`).should('not.exist');
    }

    deleteAProjectByName(name, select_AllDataGathered_checkbox = false, select_TheFormAssociatedWith_checkbox = false, select_IunderstandThatIf_checkbox = false) {

        this.PAGE_SELECTORS.AProjectCheckboxByName(name).click();
        cy.wait(2000);
        this.PAGE_SELECTORS.DeletePrj_btn().should('be.visible').and('have.attr', 'aria-disabled', 'false').and('be.enabled').click({ timeout: 5000 });

        const deletionPopup = new ListOfSurveyPage.DeleteSurveyPopupWindow();
        deletionPopup.shouldBeVisibleDeletionPopupWindow();

        if (select_AllDataGathered_checkbox)
            deletionPopup.selectChecboxByLabelContent('All data gathered for this form will be deleted.')
        if (select_TheFormAssociatedWith_checkbox)
            deletionPopup.selectChecboxByLabelContent('The form associated with this project will be deleted.')
        if (select_IunderstandThatIf_checkbox)
            deletionPopup.selectChecboxByLabelContent('I understand that if I delete this project I will not be able to recover it.')

        deletionPopup.performDeletion(true);
    }

    cancelDeletionOfProjectByName(name, select_AllDataGathered_checkbox = false, select_TheFormAssociatedWith_checkbox = false, select_IunderstandThatIf_checkbox = false) {
        this.PAGE_SELECTORS.AProjectCheckboxByName(name).click();
        this.PAGE_SELECTORS.DeletePrj_btn().click();

        const deletionPopup = new ListOfSurveyPage.DeleteSurveyPopupWindow();
        deletionPopup.shouldBeVisibleDeletionPopupWindow();

        if (select_AllDataGathered_checkbox)
            deletionPopup.selectChecboxByLabelContent('All data gathered for this form will be deleted.')
        if (select_TheFormAssociatedWith_checkbox)
            deletionPopup.selectChecboxByLabelContent('The form associated with this project will be deleted.')
        if (select_IunderstandThatIf_checkbox)
            deletionPopup.selectChecboxByLabelContent('I understand that if I delete this project I will not be able to recover it.')

        deletionPopup.shouldBeChecked('All data gathered for this form will be deleted.', true);
        deletionPopup.shouldBeChecked('The form associated with this project will be deleted.', true)
        deletionPopup.shouldBeChecked('I understand that if I delete this project I will not be able to recover it.', true)

        deletionPopup.cancelDeletion();
    }

    directDeleteAProjectByName(name) {
        this.PAGE_SELECTORS.AProjectCheckboxByName(name).click();
        cy.wait(2000);
        this.PAGE_SELECTORS.DeletePrj_btn().should('be.visible').and('have.attr', 'aria-disabled', 'false').and('be.enabled').click();

        const deletionPopup = new ListOfSurveyPage.DeleteSurveyPopupWindow();
        deletionPopup.shouldBeVisibleDeletionPopupWindow();
        deletionPopup.performDirectDelete();
    }

    //-----------------------------------------------------------------------//
    //----------------------  Sub PAGES Sections  -------------------------//
    //-----------------------------------------------------------------------//

    static DeleteSurveyPopupWindow = class {
        constructor() {
        }

        PAGE_SELECTORS = {
            popupWindow: () => cy.getByDocumentSelector('div.ajs-dialog'),

            allDataGathered_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]').eq(0),
            theFormAssociatedWith_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]').eq(1),
            isSecureContextnderstandThatIf_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]').eq(2),

            deletionCheckboxes: (position) => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]').eq(position),

            delete_btn: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="delete"]'),
            cancel_btn: () => cy.getByDocumentSelector('.ajs-dialog .ajs-cancel'),

            directDelete_btn: () => cy.getByDocumentSelector('.ajs-dialog .ajs-button.ajs-ok'),

        }

        shouldBeVisibleDeletionPopupWindow() {
            this.PAGE_SELECTORS.popupWindow().should('be.visible');
        }

        selectChecboxByLabelContent(labelContent) {
            switch (labelContent.trim().replace(/\s+/g, '').toLowerCase()) {
                case "alldatagatheredforthisformwillbedeleted.":
                    this.PAGE_SELECTORS.deletionCheckboxes(0).click();
                    break;
                case 'theformassociatedwiththisprojectwillbedeleted.':
                    this.PAGE_SELECTORS.deletionCheckboxes(1).click();
                    break;
                case 'iunderstandthatifideletethisprojectiwillnotbeabletorecoverit.':
                    this.PAGE_SELECTORS.deletionCheckboxes(2).click();
                    break;
                default:
                    throw new Error(`Element ${labelContent} is not visible/available on the DOM/screen!`);
                    break;
            }
        }

        shouldBeChecked(elementLabel, isChecked) {
            switch (elementLabel.trim().replace(/\s+/g, '').toLowerCase()) {
                case "alldatagatheredforthisformwillbedeleted.":
                    (isChecked) ? this.PAGE_SELECTORS.deletionCheckboxes(0).should('be.checked') : this.PAGE_SELECTORS.deletionCheckboxes(0).should('be.unchecked');
                    break;
                case 'theformassociatedwiththisprojectwillbedeleted.':
                    (isChecked) ? this.PAGE_SELECTORS.deletionCheckboxes(1).should('be.checked') : this.PAGE_SELECTORS.deletionCheckboxes(0).should('be.unchecked');
                    break;
                case 'iunderstandthatifideletethisprojectiwillnotbeabletorecoverit.':
                    (isChecked) ? this.PAGE_SELECTORS.deletionCheckboxes(2).should('be.checked') : this.PAGE_SELECTORS.deletionCheckboxes(0).should('be.unchecked');
                    break;
                default:
                    throw new Error(`Element ${elementLabel} is not accessible to validate its current states!`);
                    break;
            }
        }

        performDeletion() {
            this.PAGE_SELECTORS.delete_btn().click();
        }

        performDirectDelete() {
            this.PAGE_SELECTORS.directDelete_btn().click();
        }

        cancelDeletion() {
            this.PAGE_SELECTORS.cancel_btn().click();
        }


    }//DeleteSurveyPopupWindow

}//Class