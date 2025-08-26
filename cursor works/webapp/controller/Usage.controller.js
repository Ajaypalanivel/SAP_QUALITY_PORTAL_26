sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("quality.controller.Usage", {

        PAGE_SIZE: 10,

        onInit: function () {
            var sUrl = "/sap/opu/odata/sap/ZAJ_QUALITY_SB/ZAJ_USAGE_VIEW?$format=json";
            var that = this;

            jQuery.ajax({
                url: sUrl,
                method: "GET",
                success: function (data) {
                    var aResults = data?.d?.results || [];
                    
                    // Format the data before setting the model
                    var aFormattedResults = that._formatUsageData(aResults);

                    var oModel = new JSONModel({
                        UsageDataMaster: aFormattedResults,
                        UsageDataAll: aFormattedResults,
                        UsageData: [],
                        currentPage: 1,
                        totalPages: Math.max(1, Math.ceil(aFormattedResults.length / that.PAGE_SIZE))
                    });

                    that.getView().setModel(oModel);
                    that._updateTable();
                },
                error: function () {
                    MessageToast.show("Failed to load Usage data");
                }
            });
        },

        _formatUsageData: function(aData) {
            var that = this;
            return aData.map(function(item) {
                var oFormattedItem = Object.assign({}, item);
                
                // Format Decision Date to dd/mm/yyyy
                if (item.DecisionDate) {
                    oFormattedItem.DecisionDate = that._formatDate(item.DecisionDate);
                }
                
                // Format Decision Time to readable format
                if (item.DecisionTime) {
                    oFormattedItem.DecisionTime = that._formatTime(item.DecisionTime);
                }
                
                // Ensure all text fields are properly formatted to prevent line breaks
                if (item.InspectionLotNo) {
                    oFormattedItem.InspectionLotNo = String(item.InspectionLotNo).trim();
                }
                
                return oFormattedItem;
            });
        },

        _formatDate: function(sDate) {
            if (!sDate) return "";
            
            try {
                // Handle .NET serialized date format: /Date(1750...)
                if (typeof sDate === 'string' && sDate.startsWith('/Date(')) {
                    var match = sDate.match(/\/Date\((\d+)\)\//);
                    if (match && match[1]) {
                        var timestamp = parseInt(match[1]);
                        var oDate = new Date(timestamp);
                        if (!isNaN(oDate.getTime())) {
                            var day = String(oDate.getDate()).padStart(2, '0');
                            var month = String(oDate.getMonth() + 1).padStart(2, '0');
                            var year = oDate.getFullYear();
                            return day + '/' + month + '/' + year;
                        }
                    }
                }
                
                // Handle different date formats
                var oDate;
                if (typeof sDate === 'string') {
                    // If it's already in dd/mm/yyyy format, return as is
                    if (sDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        return sDate;
                    }
                    
                    // Try to parse as ISO date
                    if (sDate.includes('T') || sDate.includes('-')) {
                        oDate = new Date(sDate);
                    } else {
                        // Try to parse as SAP date format (YYYYMMDD)
                        if (sDate.length === 8) {
                            var year = sDate.substring(0, 4);
                            var month = sDate.substring(4, 6);
                            var day = sDate.substring(6, 8);
                            oDate = new Date(year, month - 1, day);
                        } else {
                            oDate = new Date(sDate);
                        }
                    }
                } else if (sDate instanceof Date) {
                    oDate = sDate;
                } else {
                    return String(sDate);
                }
                
                // Check if date is valid
                if (isNaN(oDate.getTime())) {
                    return String(sDate);
                }
                
                // Format as dd/mm/yyyy
                var day = String(oDate.getDate()).padStart(2, '0');
                var month = String(oDate.getMonth() + 1).padStart(2, '0');
                var year = oDate.getFullYear();
                
                return day + '/' + month + '/' + year;
            } catch (e) {
                return String(sDate);
            }
        },

        _formatTime: function(sTime) {
            if (!sTime) return "";
            
            try {
                // Handle ISO 8601 duration format: PT11H20M, PT09H40M, etc.
                if (typeof sTime === 'string' && sTime.startsWith('PT')) {
                    var hours = 0;
                    var minutes = 0;
                    
                    // Extract hours
                    var hourMatch = sTime.match(/(\d+)H/);
                    if (hourMatch) {
                        hours = parseInt(hourMatch[1]);
                    }
                    
                    // Extract minutes
                    var minuteMatch = sTime.match(/(\d+)M/);
                    if (minuteMatch) {
                        minutes = parseInt(minuteMatch[1]);
                    }
                    
                    // Format as HH:MM
                    var formattedHours = String(hours).padStart(2, '0');
                    var formattedMinutes = String(minutes).padStart(2, '0');
                    
                    return formattedHours + ':' + formattedMinutes;
                }
                
                return String(sTime);
            } catch (e) {
                return String(sTime);
            }
        },

        _updateTable: function () {
            var oModel = this.getView().getModel();
            var iPage = oModel.getProperty("/currentPage");
            var aAll = oModel.getProperty("/UsageDataAll");

            var iStart = (iPage - 1) * this.PAGE_SIZE;
            var iEnd = iStart + this.PAGE_SIZE;

            oModel.setProperty("/UsageData", aAll.slice(iStart, iEnd));
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onSearch: function (oEvent) {
            var sQuery = (oEvent.getParameter("newValue") || "").toLowerCase();
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/UsageDataMaster");

            var aFiltered = aMaster.filter(item =>
                (item.InspectionLotNo || "").toLowerCase().includes(sQuery) ||
                (item.UsageDecisionCode || "").toLowerCase().includes(sQuery) ||
                (item.DecisionBy || "").toLowerCase().includes(sQuery)
            );

            oModel.setProperty("/UsageDataAll", aFiltered);
            oModel.setProperty("/currentPage", 1);
            oModel.setProperty("/totalPages", Math.max(1, Math.ceil(aFiltered.length / this.PAGE_SIZE)));
            this._updateTable();
        },

        onFilterDecision: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel();
            var aMaster = oModel.getProperty("/UsageDataMaster");

            var aFiltered = (sKey === "ALL") ? aMaster : aMaster.filter(item => item.UsageDecisionCode === sKey);

            oModel.setProperty("/UsageDataAll", aFiltered);
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
