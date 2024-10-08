import { FormQuestionsPage } from "../pom/formQuestionsPage";
import { ListOfSurveyPage } from "../pom/projectListPage";
import { SurveyDetailPage } from "../pom/surveyPage";

const formTitle = 'TestsQuestions';
const listOfProjectsPage = new ListOfSurveyPage();
const surveyDetailPage = new SurveyDetailPage();
const formQuestionsPage = new FormQuestionsPage();

describe('Add Question to a Form', function () {

    before(function () {  // login       
        cy.fixture('accounts')
            .then((accounts) => accounts.super_admin)
            .then(($acct) => {
                cy.login($acct, 'super_admin')
            });

        cy.createTestProject(formTitle);
    });

    it('Adding question to a Form', function () {

        listOfProjectsPage.projectShouldExist(formTitle)

        cy.fixture('questions').then((data) => {
            listOfProjectsPage.openSurveyByName(formTitle);
            surveyDetailPage.openSurveySubPageByName('SUMMARY');
            surveyDetailPage.isFormSubPageByNameOpened('SUMMARY');
            surveyDetailPage.editFormFrom('SUMMARY');

            formQuestionsPage.addAquestion(data);

            listOfProjectsPage.openSurveyByName(formTitle);
            surveyDetailPage.openSurveySubPageByName('SUMMARY');
            surveyDetailPage.isFormSubPageByNameOpened('SUMMARY');
            surveyDetailPage.totalOfQuestionShouldBe(3);
        });
    })

    after(function () {
        surveyDetailPage.goToProjectListPage();
        listOfProjectsPage.directDeleteAProjectByName(formTitle)
    })
})