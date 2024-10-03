import { ListOfSurveyPage } from "../pom/projectListPage"

describe('Delete Project.', function () {

    beforeEach(() => {  // login       
        cy.fixture('accounts')
        .then((accounts) => accounts.super_admin)
        .then(($acct) => {            
            cy.login($acct, 'super_admin')
        })

        this.select_AllDataGathered_checkbox = true;
        this.select_TheFormAssociatedWith_checkbox = true;
        this.select_IunderstandThatIf_checkbox = true;
    });

    it.skip('Can CANCEL the deletion request of a project based on its name', () => {
        const projectName = 'survey 1';
        const surveyListPage = new ListOfSurveyPage();
        
        surveyListPage.projectShouldExist(projectName);
        surveyListPage.cancelDeletionOfProjectByName(projectName, this.select_AllDataGathered_checkbox, this.select_TheFormAssociatedWith_checkbox, this.select_IunderstandThatIf_checkbox);
        surveyListPage.projectShouldExist(projectName);
    })

    it('Can perform the deletion of a project base on its name', () => {
        const projectName = 'My new project';
        const surveyListPage = new ListOfSurveyPage();

        surveyListPage.projectShouldExist(projectName);
        surveyListPage.deleteAProjectByName(projectName, this.select_TheFormAssociatedWith_checkbox, false, this.select_IunderstandThatIf_checkbox);
    })
})
