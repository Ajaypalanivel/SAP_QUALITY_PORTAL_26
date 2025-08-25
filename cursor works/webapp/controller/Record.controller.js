sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("quality.controller.Record", {

        PAGE_SIZE: 10,

        onInit: function () {
            var sUrl = "/sap/opu/odata/sap/ZAJ_QUALITY_SB/ZAJ_RECORD_VIEW?$format=json";
            var that = this;

            jQuery.ajax({
                url: sUrl,
                method: "GET",
                success: function (data) {
                    var aResults = data?.d?.results || [];

                    var oModel = new JSONModel({
                        RecordDataMaster: aResults,
                        RecordDataAll: aResults,
                        RecordData: [],
                        currentPage: 1,
                        totalPages: Math.max(1, Math.ceil(aResults.length / that.PAGE_SIZE))
                    });

                    that.getView().setModel(oModel);
                    that._updateTable();
                },
                error: function () {
                    MessageToast.show("Failed to load Record data");
                }
            });
        },

        _updateTable: function () {
            var oModel = this.getView().getModel();
            var iPage = oModel.getProperty("/currentPage");
            var aAll = oModel.getProperty("/RecordDataAll");

            var iStart = (iPage - 1) * this.PAGE_SIZE;
            var iEnd = iStart + this.PAGE_SIZE;

            oModel.setProperty("/RecordData", aAll.slice(iStart, iEnd));
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onSearch: function (oEvent) {
            var sQuery = (oEvent.getParameter("newValue") || "").toLowerCase();
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/RecordDataMaster");

            var aFiltered = aMaster.filter(item =>
                (item.InspectionLot || "").toLowerCase().includes(sQuery) ||
                (item.OperationNo || "").toLowerCase().includes(sQuery) ||
                (item.CharacteristicNo || "").toLowerCase().includes(sQuery) ||
                (item.MaterialNumber || "").toLowerCase().includes(sQuery)
            );

            oModel.setProperty("/RecordDataAll", aFiltered);
            oModel.setProperty("/currentPage", 1);
            oModel.setProperty("/totalPages", Math.max(1, Math.ceil(aFiltered.length / this.PAGE_SIZE)));
            this._updateTable();
        },

        onFilterResult: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/RecordDataMaster");

            var aFiltered = (sKey === "ALL") ? aMaster : aMaster.filter(item => item.ResultCode === sKey);

            oModel.setProperty("/RecordDataAll", aFiltered);
            oModel.setProperty("/currentPage", 1);
            oModel.setProperty("/totalPages", Math.max(1, Math.ceil(aFiltered.length / this.PAGE_SIZE)));
            this._updateTable();
        },

        onFirstPage: function () {
            this.getView().getModel().setProperty("/currentPage", 1);
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
        }
    });
});
