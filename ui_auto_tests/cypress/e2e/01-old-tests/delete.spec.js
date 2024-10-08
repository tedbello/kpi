import { FormQuestionsPage } from "../pom/formQuestionsPage";
import { ListOfSurveyPage } from "../pom/projectListPage";
import { SurveyDetailPage } from "../pom/surveyPage";

const CancelDeletion_FormTitle = 'cancelDeleteTests';
const DeleteDeletion_FormTitle = 'deleteTests';

const listOfProjectsPage = new ListOfSurveyPage();
const surveyDetailPage = new SurveyDetailPage();
const formQuestionsPage = new FormQuestionsPage();

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
        cy.createTestProject(CancelDeletion_FormTitle);

        surveyListPage.projectShouldExist(CancelDeletion_FormTitle);
        surveyListPage.cancelDeletionOfProjectByName(CancelDeletion_FormTitle);
        surveyListPage.projectShouldExist(projectName);
    })

    it('Can perform the deletion of a project base on its name', () => {
        cy.createTestProject(DeleteDeletion_FormTitle);
        const surveyListPage = new ListOfSurveyPage();

        surveyListPage.projectShouldExist(DeleteDeletion_FormTitle);
        surveyListPage.directDeleteAProjectByName(DeleteDeletion_FormTitle);
        surveyListPage.projectShouldExist(DeleteDeletion_FormTitle, false);
    })
})
