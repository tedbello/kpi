export class NewProjectSettingModal {

    /** **/
    constructor() {
    }

    MODAL_SELECTORS = {
        modalMain_Pane: () => cy.getByDataCy('modal__content'),
        modalPaneHeader: () => cy.getByDataCy('modal__header > modal__title'),
        modalPaneClose: () => cy.getByDataCy('modal__header > a'),

        modalBodyPaneForm: () => cy.getByDataCy('project-settings.project-settings--project-details'),

        buildProjectFrom: (type) => cy.getByDocumentSelector(".form-modal__item button").filter(`:contains(${type})`),

        projectTitle: () => cy.getByDataCy('title'),
        projectDescription: () => cy.getByDataCy('description'),
        projectSector: () => cy.getByDataCy('sector'),
        projectCountry: () => cy.getByDataCy('country'),
        back_btn: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("Back")'),
        createProject_btn: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("Create project")'),

        returnToMainList_link: () => cy.getByDocumentSelector('.left-tooltip.form-builder-header__cell'),

        saveNewPrj_btn: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("save")'),
        closeNewPrj_btn: () => cy.getByDocumentSelector('button.k-button i.k-icon-close'),
    }

    createProjectByTypeName(type) {
        cy.get('form.project-settings.project-settings--form-source').then(($form) => {
            $form.on('submit', (e) => {
                e.preventDefault();  // Prevent Cypress from submitting the form
            });
        });

        this.MODAL_SELECTORS.buildProjectFrom(type).should('exist').click();
        cy.waitForElement('.modal__content .modal__title');
    }

    fillInProjectTitle(title) {
        this.MODAL_SELECTORS.projectTitle().should('exist').type(title);
    }

    fillInProjectDescription(description) {
        this.MODAL_SELECTORS.projectDescription().should('exist').type(description)
    }

    selectProjectSector(sector) {
        this.MODAL_SELECTORS.projectSector().should('exist').click().type(sector)
        cy.get('[id^=react-select-2-option]').click();
    }

    selectProjectCountry(country) {
        this.MODAL_SELECTORS.projectCountry().should('exist').click().type(country)
        cy.get('[id^=react-select-3-option]').eq(0).click();
    }

    submitCreateNewProject() {
        this.MODAL_SELECTORS.createProject_btn().should('not.be.disabled').click();
        cy.waitForElement('.left-tooltip.form-builder-header__cell');
    }

    CancelSubmitCreateNewProject() {
        this.MODAL_SELECTORS.back_btn().should('not.be.disabled').click();
    }


} //Class
