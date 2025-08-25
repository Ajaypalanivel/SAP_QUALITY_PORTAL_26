sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat"
], function (Controller, MessageToast, JSONModel, DateFormat) {
    "use strict";

    return Controller.extend("quality.controller.Inspection", {

        PAGE_SIZE: 10,   // 10 rows per page

        onInit: function () {
            var sUrl = "/sap/opu/odata/sap/ZAJ_QUALITY_SB/ZAJ_INSPECTION_VIEW?$format=json";
            var that = this;

            jQuery.ajax({
                url: sUrl,
                method: "GET",
                success: function (data) {
                    var aResults = data?.d?.results || [];

                    var oJsonModel = new JSONModel({
                        InspectionDataMaster: aResults,  // full dataset
                        InspectionDataAll: aResults,     // filtered dataset
                        InspectionData: [],              // current page dataset
                        currentPage: 1,
                        totalPages: Math.max(1, Math.ceil(aResults.length / that.PAGE_SIZE))
                    });

                    that.getView().setModel(oJsonModel);
                    that._updateTable();
                },
                error: function (err) {
                    MessageToast.show("Failed to load inspection data");
                    console.error("Inspection OData error:", err);
                }
            });
        },

        // 📋 Update Table with Pagination
        _updateTable: function () {
            var oModel = this.getView().getModel();
            var iPage = oModel.getProperty("/currentPage");
            var aAll = oModel.getProperty("/InspectionDataAll");

            var iStart = (iPage - 1) * this.PAGE_SIZE;
            var iEnd = iStart + this.PAGE_SIZE;
            var aPageData = aAll.slice(iStart, iEnd);

            oModel.setProperty("/InspectionData", aPageData);
        },

        // 🔙 Back button
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        // 🔍 Search
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/InspectionDataMaster");

            var aFiltered = aMaster.filter(function (item) {
                return (
                    (item.InspectionLot && item.InspectionLot.toLowerCase().includes(sQuery.toLowerCase())) ||
                    (item.MaterialNumber && item.MaterialNumber.toLowerCase().includes(sQuery.toLowerCase()))
                );
            });

            oModel.setProperty("/InspectionDataAll", aFiltered);
            oModel.setProperty("/currentPage", 1);
            oModel.setProperty("/totalPages", Math.max(1, Math.ceil(aFiltered.length / this.PAGE_SIZE)));
            this._updateTable();
        },

        // 🎯 Filter by Usage Decision
        onFilterUD: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/InspectionDataMaster");

            var aFiltered;
            if (sKey && sKey !== "ALL") {
                aFiltered = aMaster.filter(function (item) {
                    return item.UsageDecisionCode === sKey;
                });
            } else {
                aFiltered = aMaster;
            }

            oModel.setProperty("/InspectionDataAll", aFiltered);
            oModel.setProperty("/currentPage", 1);
            oModel.setProperty("/totalPages", Math.max(1, Math.ceil(aFiltered.length / this.PAGE_SIZE)));
            this._updateTable();
        },

        // 📄 Pagination methods
        onFirstPage: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/currentPage", 1);
            this._updateTable();
        },

        onPrevPage: function () {
            var oModel = this.getView().getModel();
            var iPage = oModel.getProperty("/currentPage");
            if (iPage > 1) {
                oModel.setProperty("/currentPage", iPage - 1);
                this._updateTable();
            }
        },

        onNextPage: function () {
            var oModel = this.getView().getModel();
            var iPage = oModel.getProperty("/currentPage");
            var iTotal = oModel.getProperty("/totalPages");
            if (iPage < iTotal) {
                oModel.setProperty("/currentPage", iPage + 1);
                this._updateTable();
            }
        },

        onLastPage: function () {
            var oModel = this.getView().getModel();
            var iTotal = oModel.getProperty("/totalPages");
            oModel.setProperty("/currentPage", iTotal);
            this._updateTable();
        },

        // 📅 Date Formatter
        formatDate: function (sDate) {
            if (!sDate) return "";
            var timestamp = parseInt(sDate.replace(/[^0-9]/g, ""), 10);
            var oDate = new Date(timestamp);
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });
            return oDateFormat.format(oDate);
        }
    });
});
