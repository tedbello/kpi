export class JsonParser {
  
  constructor(jsonObject) {
    this.jsonObject = jsonObject;
  }

  // Method to get a JSON object based on element name
  getElementByName(elementName) {
    if (this.jsonObject.hasOwnProperty(elementName)) {
      return this.jsonObject[elementName];
    } 
    else {
      throw new Error(`Element '${elementName}' not found in the JSON object.`);
    }
  }
} //  jsonParser



// JsonLoader class to handle loading the JSON from a fixture and returning parsed data
export class JsonLoader {
  constructor(fixtureName) {
    this.fixtureName = fixtureName;
  }

  // Method to load the fixture and return the requested element using JsonParser
  loadElement(elementName) {

    return new Cypress.Promise((resolve, reject) => {
      cy.fixture(this.fixtureName)
        .then((jsonObject) => {
          const parser = new JsonParser(jsonObject);
          const element = parser.getElementByName(elementName);
          resolve(element);
        })
    });
  }
}
