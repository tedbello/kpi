import { NewProjectSettingModal } from "../pom/newProjectModalPage";
import { ListOfSurveyPage } from "../pom/projectListPage";

describe('Create Form', function () {

    before(function () {  // login       
        cy.fixture('accounts')
            .then((accounts) => accounts.super_admin)
            .then(($acct) => {
                cy.login($acct, 'super_admin')
            });

        this.prjTitle = 'New-Project';
        this.listOfProjectsPage = new ListOfSurveyPage();
    });

    it('Creates a Form', function () {
        cy.createTestProject(this.prjTitle)

        this.listOfProjectsPage.projectShouldExist(this.prjTitle)
    });

    after(function () {
        this.listOfProjectsPage.directDeleteAProjectByName(this.prjTitle)
    })
})