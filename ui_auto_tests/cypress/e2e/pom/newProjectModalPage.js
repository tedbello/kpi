export class NewProjectSettingModal {

    /**
     *
     */
    constructor() {       
    }

    MODAL_SELECTORS = {
        modalMain_Pane:  () => cy.getByDataCy('modal__content'),
        modalPaneHeader: () => cy.getByDataCy('modal__header > modal__title'),
        modalPaneClose:  () => cy.getByDataCy('modal__header > a'),

        modalBodyPaneForm:  () => cy.getByDataCy('project-settings.project-settings--project-details'),

        projectName:   () => cy.getByDataCy('title'),
        description:   () => cy.getByDataCy('description'),
        sector:        () => cy.getByDataCy('sector'),
        country:       () => cy.getByDataCy('country'),
        back:          () => cy.getByDataCy('button[type="button"]').contains('Back'),
        createProject: () => cy.getByDataCy('button[type="submit"]').contains('Create project'),


        function createNewProjectwithSetting(prjName, prjDescription, prjSection, prjCountry)}{
            MODAL_SELECTORS.projectName().type(prjName);
        }

    };

    

    

    
    
} //Class
