
export class createAnAccountPage {

    /** **/
    constructor() {       
    }

    PAGE_SELECTORS = {
        
        AccountaPage_leftPane:  () => cy.getByDocumentSelector('.registration__first-half'),



        Full_name:             () => cy.getByDocumentSelector('#id_name'),
        Username:              () => cy.getByDocumentSelector('#id_username'),
        Email:                 () => cy.getByDocumentSelector('#id_email'),
        Password:              () => cy.getByDocumentSelector('#id_password1'),
        Password_confirmation: () => cy.getByDocumentSelector('#id_password2'),
        Create_Account_btn:     () => cy.getByDocumentSelector('button[type="submit"]')
    }

    createNewAccount(user){
        cy.getByDocumentSelector('a.registration__create-account').click().wait(1000);

        this.PAGE_SELECTORS.Full_name().type(user.fullname);
        this.PAGE_SELECTORS.Username().type(user.username);
        this.PAGE_SELECTORS.Email().type(user.email);
        this.PAGE_SELECTORS.Password().type(user.password);
        this.PAGE_SELECTORS.Password_confirmation().type(user.password);
        this.PAGE_SELECTORS.Create_Account_btn().click().wait(3000);
    }
    
} //Class
