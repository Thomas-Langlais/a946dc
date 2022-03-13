/// <reference types="cypress" />

const peter = {
  username: "peter",
  email: "peter@example.com",
  password: "Z6#6%xfLTarZ9U",
};
const tommy = {
  username: "tommy",
  email: "tommy@example.com",
  password: "L%e$xZHC4QKP@F",
};

describe("Feature: conversation read status", () => {
  before("register users", () => {
    cy.signup(peter.username, peter.email, peter.password);
    cy.logout();
    cy.signup(tommy.username, tommy.email, tommy.password);
    cy.logout();
  });

  before("send messages", () => {
    cy.login(peter.username, peter.password);

    cy.get("input[name=search]").type("tommy");
    cy.contains("tommy").click();

    cy.get("input[name=text]").type("First message{enter}");
    cy.get("input[name=text]").type("Second message{enter}");
    cy.get("input[name=text]").type("Third message{enter}");

    cy.logout();
  });

  it("displays the chat with unread messages", () => {
    cy.login(tommy.username, tommy.password);

    const peter = cy.contains("peter");

    const badge = peter.contains("3");
    
    badge.should("be.visible");
    peter.click();
    badge.should("be.visible");
  })
});