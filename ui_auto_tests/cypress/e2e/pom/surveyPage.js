require('cypress-downloadfile/lib/downloadFileCommand');

export class SurveyDetailPage {

    summaryPage;
    dataSubPage;

    /** **/
    constructor() {
        this.dataSubPage = new SurveyDetailPage.SurveyDataPage();
        this.summaryPage = new SurveyDetailPage.SurveySummaryPage();
    }

    PAGE_SELECTORS = {
        summarySubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(1)'),
        formSubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(2)'),
        dataSubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(3)'),
        settingsSubPage_Link: () => cy.getByDocumentSelector('ul[class*="projectTopTabs-module__tabs"] > :nth-child(4)'),

        projectListPage_btn: () => cy.getByDocumentSelector('[data-tip="Projects"]'),
        libraryListPage_btn: () => cy.getByDocumentSelector('[data-tip="Library"]'),
    }

    openSurveySubPageByName(name) {
        debugger
        switch (name.toLowerCase().trim()) {
            case 'summary': this.PAGE_SELECTORS.summarySubPage_Link().click(); break;
            case 'form': this.PAGE_SELECTORS.formSubPage_Link().click(); break;
            case 'data': this.PAGE_SELECTORS.dataSubPage_Link().click(); break;
            case 'setting': this.PAGE_SELECTORS.settingsSubPage_Link().click(); break;
            default: break;
        }
    }

    isFormSubPageByNameOpened(name) {
        switch (name.toLowerCase().trim()) {
            case 'summary': this.summaryPage.isSubPageSummaryVisible(); break
            case 'form': break;
            case 'data': this.dataSubPage.isSubPageDataVisible(); break;
            case 'setting': break;
            default: break;
        }
    }

    editFormFrom(name) {
        this.isFormSubPageByNameOpened(name);
        if (name.toLowerCase().trim() == 'summary') {
            this.summaryPage.editForm();
        }
    }

    totalOfQuestionShouldBe(totalQuestions) {
        this.summaryPage.formProjectShouldHaveQuestionCount(totalQuestions)
    }

    //Methode to export servey based on format provided
    exportSurveyInFormat(formatType, theQuestion) {
        return this.dataSubPage.Export(formatType, theQuestion);
    }

    shouldHaveBeenExported(fileName) {
        this.dataSubPage.isFileBeenExported(fileName);
    }

    goToProjectListPage() {
        this.PAGE_SELECTORS.projectListPage_btn().click();
        cy.waitForSpinnerToDisappear();
    }

    //-----------------------------------------------------------------------//
    //----------------------  Sub Classes Sections  -------------------------//
    //-----------------------------------------------------------------------//

    // Summary Page class
    static SurveySummaryPage = class {
        constructor() { }
        PAGE_SELECTORS = {
            editSurvey_btn: () => cy.getByDataCy('edit'),
            formProjectInfoStatusSection: () => cy.getByDocumentSelector('div.form-view__group').eq(1).find('.form-view__cell'),
            submissionsChart_labels: () => cy.getByDocumentSelector('div[class*="submissionsCountGraph-module"]')
        }

        editForm() {
            this.PAGE_SELECTORS.editSurvey_btn().click();
        }

        isSubPageSummaryVisible() {
            this.PAGE_SELECTORS.submissionsChart_labels().should('be.visible');
        }

        formProjectShouldHaveQuestionCount(nberOfQuestion) {
            this.PAGE_SELECTORS.formProjectInfoStatusSection().eq(1)
                .should('be.visible')
                .should('have.text', 'Questions' + nberOfQuestion);

        }

    }//SubClass Summary


    // Form Page class
    static SurveyFormPage = class {
        constructor() { }
        PAGE_SELECTORS = {}

    }//SubClass Form

    // Data Page class
    static SurveyDataPage = class {

        /** **/
        constructor() { }

        PAGE_SELECTORS = {
            table_Link: () => getByDocumentSelector('div.form-view__sidetabs :nth-child(1)'),
            reports_Link: () => cgetByDocumentSelector('div.form-view__sidetabs :nth-child(2)'),
            gallery_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(3)'),
            download_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(4)'),
            map_Link: () => cy.getByDocumentSelector('div.form-view__sidetabs :nth-child(5)'),

            downloadTitle: () => cy.getByDocumentSelector('form-view__cell--page-title').getByTextContent('Downloads'),
            selectExportType_Ddown: () => cy.getByTextContent('Select export type').getByDocumentSelector('kobo-select__value-container'),
            advanced_options: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("Advanced options")'),
            select_questions_to_be_exported: () => cy.getByDocumentSelector('.toggle-switch__label').filter(':contains("Select questions to be exported")'),

            deselect_all: () => cy.getByDocumentSelector('button.k-button label.k-button__label').filter(':contains("all")').eq(1),
            questions_list: () => cy.getByDocumentSelector('ul.multi-checkbox li'),
            export: () => cy.getByDocumentSelector('button[type="submit"]').filter(':contains("Export")'),
            export_Download_btn: () => cy.getByDocumentSelector('table.simple-table.simple-table--project-exports tbody').find('button').eq(0),

            deployedSurvey_table: () => cy.getByDocumentSelector('div.rt-table'),
        }

        isSubPageDataVisible() {
            this.PAGE_SELECTORS.deployedSurvey_table().should('be.visible');
        }

        Export(format, testQuestion) {
            this.PAGE_SELECTORS.download_Link().click();
            cy.wait(1000);
            this.PAGE_SELECTORS.advanced_options().click();
            this.PAGE_SELECTORS.select_questions_to_be_exported().click();
            this.PAGE_SELECTORS.deselect_all().click({ force: true });

            //Select 1 question
            this.PAGE_SELECTORS.questions_list().filter(`:contains(${testQuestion})`).click();
            this.PAGE_SELECTORS.export().click();

            cy.waitForElement('table.simple-table.simple-table--project-exports');
            cy.wait(3000);

            cy.intercept('GET', '**').as('fileDownload');  // Intercept the file download request

            // Click the download button
            this.PAGE_SELECTORS.export_Download_btn().should('contain', 'Download').should('be.visible').click();

            // Wait for the download to complete
            return cy.wait('@fileDownload', { timeout: 10000 }).then((interception) => {
                const downloadUrl = interception.response.url;
                cy.log(`downloadUrl : ${downloadUrl}`);

                // Return the file name using cy.wrap to make it chainable
                return cy.wrap(downloadUrl.split('/').pop()).as("exportedFileName");
            });

            return cy.get("@exportedFileName").then((fileName) => {
                return fileName;
            })
        }

        interceptFileTobeDownlaod() {
            cy.intercept('GET', '**').as('fileDownload');  // Intercept the file download request

            // Click the download button
            this.PAGE_SELECTORS.export_Download_btn().should('contain', 'Download').should('be.visible').click();

            // Wait for the download to complete
            return cy.wait('@fileDownload', { timeout: 10000 }).then((interception) => {
                const downloadUrl = interception.response.url;
                cy.log(`downloadUrl : ${downloadUrl}`);

                return downloadUrl.split('/').pop();
            });
        }

        isFileBeenExported(aFile) {
            cy.readFile(`cypress/downloads/${aFile}`).should('exist');
        }

    }//SubClass Data

    // Settings Page class
    static SurveySettingsPage = class {
        constructor() { }
        PAGE_SELECTORS = {}

    }//SubClass Settings

} //Class Survey Details 
