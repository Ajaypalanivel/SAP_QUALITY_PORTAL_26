sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("quality.controller.Home", {
    onInspection: function () {
      this.getOwnerComponent().getRouter().navTo("inspection");
    },
    onRecord: function () {
      this.getOwnerComponent().getRouter().navTo("record");
    },
    onUsage: function () {
      this.getOwnerComponent().getRouter().navTo("usage");
    },

    // 🔹 Logout handler
    onLogout: function () {
      MessageToast.show("Logged out successfully");
      this.getOwnerComponent().getRouter().navTo("login", {}, true); 
      // the "true" parameter replaces history so back button won't return to Home
    }
  });
});
