export class NewProjectSettingModal {

    /** **/
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
        }

    createNewProjectwithSetting(){
        cy.wait(5000)   // Weird application behavior!
        cy.fixture('projects')
            .then(($projectSetting) => {
                this.MODAL_SELECTORS.projectName().type($projectSetting.project_admin.projectName);
                this.MODAL_SELECTORS.description().type($projectSetting.project_admin.description);
                
                this.MODAL_SELECTORS.sector().click();  
                cy.get('*[id^=react-select-2-option]')
                .then((options) => {
                    const targetItem = [...options].find((el) => el.innerText === $projectSetting.project_admin.sector);  
                    if (targetItem) {
                        cy.wrap(targetItem).click();
                    }
                })
                
                this.MODAL_SELECTORS.country().click();
                cy.get('*[id^=react-select-3-option-]')
                .then((options) => {
                    const targetItem = [...options].find((el) => el.innerText === $projectSetting.project_admin.country);  
                    if (targetItem) {
                        cy.wrap(targetItem).click();
                    }
                })
            });

        //this.MODAL_SELECTORS.createProject().click();
    }
    
} //Class
