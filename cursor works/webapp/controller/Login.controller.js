sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("quality.controller.Login", {
    onInit: function() {
      // Add any initialization if needed
    },

    onLogin: function () {
      var empId = this.byId("empId").getValue();
      var password = this.byId("password").getValue();

      if (!empId || !password) {
        MessageBox.error("Please enter Email ID and Password");
        return;
      }

      var oModel = this.getOwnerComponent().getModel();
      var sPath = "/ZAJ_LOGIN_VIEW(p_emp_id='" + empId + "',p_password='" + password + "')/Set";

      oModel.read(sPath, {
        success: function (oData) {
          if (oData.results && oData.results.length > 0 && oData.results[0].MESSAGE === "Login Successful") {
            MessageToast.show("Login Successful");
            this.getOwnerComponent().getRouter().navTo("home");
          } else {
            MessageBox.error("Invalid Credentials");
          }
        }.bind(this),
        error: function () {
          MessageBox.error("Login Failed - check connection");
        }
      });
    }
  });
});