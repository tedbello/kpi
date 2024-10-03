
export class ListOfSurveyPage {

    /** **/
    constructor() {   
    }

    PAGE_SELECTORS = {
        projectTable:  () => cy.getByDocumentSelector ('div[class*=projectsTable-module__body-] > div'),
        listOfSurveys: () => cy.getByDataCy('asset'),

        AProjectCheckboxByName: (title) => cy.getByDataCy('asset').filter(`:contains(${title})`).parent().parent().children().first(),

        archivePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(0),
        SharePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(1),
        DeletePrj_btn: () => cy.getByDocumentSelector('[class*="projectActions-module"] button').eq(2),
    }

    OpenSurveyByName(name){        
        this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`).click();
    }

    projectShouldExist(name){
        this.PAGE_SELECTORS.listOfSurveys().filter(`:contains(${name})`).should('exist').and('be.visible');
    }
    
    deleteAProjectByName(name, select_AllDataGathered_checkbox=false, select_TheFormAssociatedWith_checkbox=false, select_IunderstandThatIf_checkbox=false){
   
        this.PAGE_SELECTORS.AProjectCheckboxByName(name).click();
        this.PAGE_SELECTORS.DeletePrj_btn().click();

        const deletionPopup = new ListOfSurveyPage.DeleteSurveyPopupWindow();
        deletionPopup.shouldBeVisibleDeletionPopupWindow();

        if(select_AllDataGathered_checkbox) 
            deletionPopup.selectChecboxByLabelContent('All data gathered for this form will be deleted.')
        if(select_TheFormAssociatedWith_checkbox) 
            deletionPopup.selectChecboxByLabelContent('The form associated with this project will be deleted.')
        if(select_IunderstandThatIf_checkbox) 
            deletionPopup.selectChecboxByLabelContent('I understand that if I delete this project I will not be able to recover it.')

        deletionPopup.performDeletion();
    }

    cancelDeletionOfProjectByName(name, select_AllDataGathered_checkbox=false, select_TheFormAssociatedWith_checkbox=false, select_IunderstandThatIf_checkbox=false){
        this.PAGE_SELECTORS.AProjectCheckboxByName(name).click();
        this.PAGE_SELECTORS.DeletePrj_btn().click();

        const deletionPopup = new ListOfSurveyPage.DeleteSurveyPopupWindow();
        deletionPopup.shouldBeVisibleDeletionPopupWindow();

        if(select_AllDataGathered_checkbox) 
            deletionPopup.selectChecboxByLabelContent('All data gathered for this form will be deleted.')
        if(select_TheFormAssociatedWith_checkbox) 
            deletionPopup.selectChecboxByLabelContent('The form associated with this project will be deleted.')
        if(select_IunderstandThatIf_checkbox) 
            deletionPopup.selectChecboxByLabelContent('I understand that if I delete this project I will not be able to recover it.')

        deletionPopup.shouldBeChecked('All data gathered for this form will be deleted.', true);
        deletionPopup.shouldBeChecked('The form associated with this project will be deleted.', true)
        deletionPopup.shouldBeChecked('I understand that if I delete this project I will not be able to recover it.', true)

        deletionPopup.cancelDeletion();
    }


    
    // ----------------------  Sub Classes Sections  --------------------------

    static DeleteSurveyPopupWindow =  class {      
        constructor() {       
        }  

        PAGE_SELECTORS = {
            PopupWindow:() => cy.getByDocumentSelector('div.ajs-dialog'),

            AllDataGathered_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]' ).eq(0),
            TheFormAssociatedWith_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]' ).eq(1),  
            IunderstandThatIf_cbox: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]' ).eq(2),

            DeletionCheckboxes: (position) => cy.getByDocumentSelector('.ajs-dialog [data-cy="checkbox"]' ).eq(position),

            Delete_btn: () => cy.getByDocumentSelector('.ajs-dialog [data-cy="delete"]'),
            Cancel_btn: () => cy.getByDocumentSelector('.ajs-dialog .ajs-cancel'),            
        }

        shouldBeVisibleDeletionPopupWindow(){
            this.PAGE_SELECTORS.PopupWindow().should('be.visible');
        }

        selectChecboxByLabelContent(labelContent){
            switch (labelContent.trim().replace(/\s+/g, '').toLowerCase()) {
                case "alldatagatheredforthisformwillbedeleted.":
                    this.PAGE_SELECTORS.DeletionCheckboxes(0).click();
                    break;
                case 'theformassociatedwiththisprojectwillbedeleted.':
                    this.PAGE_SELECTORS.DeletionCheckboxes(1).click();
                break;
                case 'iunderstandthatifideletethisprojectiwillnotbeabletorecoverit.':
                    this.PAGE_SELECTORS.DeletionCheckboxes(2).click();
                break;            
                default:
                    throw new Error(`Element ${labelContent} is not visible/available on the DOM/screen!`);
                    break;
            }
        }

        shouldBeChecked(elementLabel, isChecked){
            switch (elementLabel.trim().replace(/\s+/g, '').toLowerCase()) {
                case "alldatagatheredforthisformwillbedeleted.":
                    (isChecked)? this.PAGE_SELECTORS.DeletionCheckboxes(0).should('be.checked'): this.PAGE_SELECTORS.DeletionCheckboxes(0).should('be.unchecked');
                    break;
                case 'theformassociatedwiththisprojectwillbedeleted.':
                    (isChecked)? this.PAGE_SELECTORS.DeletionCheckboxes(1).should('be.checked'): this.PAGE_SELECTORS.DeletionCheckboxes(0).should('be.unchecked');
                break;
                case 'iunderstandthatifideletethisprojectiwillnotbeabletorecoverit.':
                    (isChecked)? this.PAGE_SELECTORS.DeletionCheckboxes(2).should('be.checked'): this.PAGE_SELECTORS.DeletionCheckboxes(0).should('be.unchecked');
                break;            
                default:
                    throw new Error(`Element ${elementLabel} is not accessible to validate its current states!`);
                    break;
            }
        }

        performDeletion(){
            //this.PAGE_SELECTORS.Delete_btn().click();
            this.PAGE_SELECTORS.Delete_btn().should('be.disabled') /// TEMPORARLY
        }

        cancelDeletion(){
            this.PAGE_SELECTORS.Cancel_btn().click();
        }
    
        
    }//DeleteSurveyPopupWindow

}//Class