/*
  IMPORTANT!!! Save and commit your changes in script in staticReources/CustomPricingScript.resource
*/
const DEBUG = false;

export class USSQuoteCalculatorPlugin {
    private DEBUG = false;
    public calculator: any;
    public hffZipcodes = [];
    private parentQuoteType = '';
    private projectId = '';

    constructor() {
        this.DEBUG = DEBUG;
    }

// PIT-488
public async onInit(quoteLineModels, conn): Promise<void> {
    return new Promise((resolve, reject) => {
        const needHFFLogic = quoteLineModels.map((item) => item.record.SBQQ__Product__r.Apply_Houston_Franchise_Fee__c).includes(true);
        if (needHFFLogic) {
            conn
            .query("SELECT Zip_Code__c FROM Serviceable_Zip_Code__c WHERE Apply_Houston_Franchise_Fee__c = TRUE")
            .then((result) => {
                this.hffZipcodes = result.records.map((item) => item.Zip_Code__c);
                resolve();
            })
            .catch((error) => {
                console.warn("Error retrieving data from Serviceable_Zip_Code__c.", error.errorCode, error.message);
                resolve();
            });
        } else {
            resolve();
        }
    })
};

public onBeforeCalculate(quoteModel, quoteLineModels, conn): Promise<void> {
    return new Promise((resolve, reject) => {
        // PIT-488
        this.setDefaults(quoteModel, quoteLineModels);

        const quoteQuery =
            "SELECT Id, Name, SBQQ__StartDate__c, SBQQ__EndDate__c, Fuel_Surcharge_Percent__c, SBQQ__Type__c, NF_Quote_Type__c, SBQQ__OriginalQuote__r.Order_Type__c,  " +
            "SBQQ__Opportunity2__r.USF_Project__r.Project_ID_SF__c, Billing_Period__c, " +
            "(SELECT Id, SBQQ__StartDate__c, SBQQ__EndDate__c " +
            " FROM SBQQ__LineItems__r) FROM SBQQ__Quote__c " +
            " WHERE Id = '" +
            quoteModel.record["Id"] +
            "'";
        conn
            .query(quoteQuery)
            .then((quoteResult) => {
                let lineIdToLineRecordMap = new Map();
                if (quoteResult.totalSize > 0) {
                    quoteResult.records.forEach((quoRecord) => {
                        this.parentQuoteType = quoRecord["SBQQ__OriginalQuote__r"] != null ? quoRecord["SBQQ__OriginalQuote__r"].Order_Type__c : null;
                        this.projectId = quoRecord["SBQQ__Opportunity2__r"].USF_Project__r != null ? quoRecord["SBQQ__Opportunity2__r"].USF_Project__r.Project_ID_SF__c : null;
                        let quoteLineList = quoRecord["SBQQ__LineItems__r"];
                        if (quoteLineList && quoteLineList.totalSize > 0) {
                            quoteLineList.records.forEach((lineRec) => {
                                lineIdToLineRecordMap.set(lineRec.Id, lineRec);
                            });

                            if (lineIdToLineRecordMap && lineIdToLineRecordMap.size > 0) {
                                quoteModel.lineItems.forEach((lineItems) => {
                                    if (lineIdToLineRecordMap.get(lineItems.record["Id"])) {
                                        if (!lineItems.record["SBQQ__StartDate__c"]) {
                                            lineItems.record["SBQQ__StartDate__c"] =
                                                lineIdToLineRecordMap.get(
                                                    lineItems.record["Id"]
                                                ).SBQQ__StartDate__c;
                                        }
                                        if (!lineItems.record["SBQQ__EndDate__c"]) {
                                            lineItems.record["SBQQ__EndDate__c"] =
                                                lineIdToLineRecordMap.get(
                                                    lineItems.record["Id"]
                                                ).SBQQ__EndDate__c;
                                        }
                                    }
                                });
                            }
                        }
                    });
                }

                quoteModel.lineItems.forEach((lineItem) => {
                    //console.log('@3333333: ', lineItem.record["SBQQ__ProductName__c"] + ' :: ' + lineItem.record["SBQQ__StartDate__c"]);
                    if (!lineItem.record["SBQQ__RequiredBy__c"]) {
                        if (!lineItem.record["SBQQ__StartDate__c"]) {
                            lineItem.record["SBQQ__StartDate__c"] =
                                quoteModel.record["SBQQ__StartDate__c"];
                        }
                        if (!lineItem.record["SBQQ__EndDate__c"]) {
                            lineItem.record["SBQQ__EndDate__c"] =
                                quoteModel.record["SBQQ__EndDate__c"];
                        }
                    }
                });

                this.GenerateProductDescription(quoteModel.lineItems);
                //Gary US-0005979
                if (quoteModel.record["Sub_Order_Type__c"] !== 'Event') {
                    this.DeliveryPickUpDate(quoteModel, quoteLineModels);
                }
                resolve();
            })
            .catch((err) => {
                console.warn(
                    "onBeforeCalculate Error while querying quote line details",
                    err
                );
                resolve();
            });
    });
}


private GenerateProductDescription(lineItems) {
    try {
        const productDescriptions = {};
        const quoteLineMap = {};
        console.log("generateProductDescription start");
        for (let qlItem of lineItems) {
            const ql = qlItem.record;
            quoteLineMap[ql.SBQQ__Number__c] = ql;
            if ("Consumable" === ql.Product_Type__c && ql.SBQQ__RequiredBy__r) {
                const requiredBy = ql.SBQQ__RequiredBy__r.SBQQ__Number__c;
                if (!productDescriptions[requiredBy]) {
                    productDescriptions[requiredBy] =
                        ql.SBQQ__ProductName__c + "(" + ql.SBQQ__Quantity__c + ")";
                } else {
                    productDescriptions[requiredBy] =
                        productDescriptions[requiredBy] +
                        ", " +
                        ql.SBQQ__ProductName__c +
                        "(" +
                        ql.SBQQ__Quantity__c +
                        ")";
                }
            }
        }

        console.log("generateProductDescription", productDescriptions);
        if (Object.keys(productDescriptions).length > 0) {
            for (let bundleId of Object.keys(productDescriptions)) {
                if (quoteLineMap[bundleId].Delivered__c != null) {
                    quoteLineMap[bundleId].Jobsite_Product_Description__c =
                        quoteLineMap[bundleId].Delivered__c +
                        ": " +
                        productDescriptions[bundleId];
                    console.log(
                        "generateProductDescription",
                        quoteLineMap[bundleId].Jobsite_Product_Description__c
                    );
                }
            }
        }
    } catch (e) {
        console.log("generateProductDescription", e);
    }
}

private DeliveryPickUpDate(quoteModel, quoteLineModels) {
    let today = new Date();
    let tomorrowDate = new Date();
    let lineItemStartDates = [];
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    //parentItem
    for (let i of quoteLineModels) {
        const deliveryDate = i.record["SBQQ__StartDate__c"];
        const pickupDate = i.record["SBQQ__EndDate__c"];
        const startDateMod = new Date(deliveryDate);
        const pickupDateMod = new Date(pickupDate);
        i.record["Delivery_Date_Today__c"] = "false";
        i.record["Pick_Up_Date_Tomorrow__c"] = "false";
        lineItemStartDates.push(startDateMod);

        //If the current node is a child node
        if (i.parentItem) {
            let parent = i.parentItem;
            const p_deliveryDate = parent.record["SBQQ__StartDate__c"];
            const p_pickupDate = parent.record["SBQQ__EndDate__c"];
            i.record["SBQQ__StartDate__c"] = p_deliveryDate;
            i.record["SBQQ__EndDate__c"] = p_pickupDate;
        }
    }

    const mnDate = Math.min.apply(null, lineItemStartDates);
    if (mnDate && quoteModel.record["SBQQ__StartDate__c"]) {
        const minStartDate = new Date(mnDate);
        const quoteStartDate = new Date(quoteModel.record["SBQQ__StartDate__c"]);
        if (quoteStartDate > minStartDate) {
            quoteModel.record["SBQQ__StartDate__c"] = mnDate;
        }
    }
}

private logInfo(message, quoteModel, conn) {
    conn.sobject('Log__c').create({
        Name: quoteModel.record["Id"],
        Log_Type__c: 'Other',
        Related_Object__c: 'SBQQ__Quote__c',
        Message__c: message,
        Related_Record__c: JSON.stringify(quoteModel.record)
      })
      .then((result) => {console.log(result);})
      .catch((error) => {console.error('onAfterCalculate Log__c error', error);})
}

public async onAfterCalculate(quoteModel, quoteLineModels, conn): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("quote model", quoteModel);

        // only calculate pricing if either the action is in a browser or the server-side calculation is enabled
        // AWS: This code block is not relevant for running the MyUSS engine
        // const enableServerSide = quoteModel.record["Enable_Server_Side_Pricing_Calculation__c"];
        // const inBrowser = typeof window !== "undefined";
        // if (this.DEBUG) {
        //     this.logInfo("onAfterCalculate: quoteId: " + quoteModel.record["Id"] + " enableServerSide: " + enableServerSide + " inBrowser: " + inBrowser, quoteModel, conn);
        // }
        // if (!inBrowser && !enableServerSide) {
        //     return resolve();
        // }
        const accountId = quoteModel.record["SBQQ__Account__c"];
        const accountQuery =
            "SELECT USF_Account_Number__c, USS_Customer_Potential_Tier__c, Acquisition_Code_Name__c, " +
            "Account_Hierarchy_List__c, Ultimate_Parent_Account__r.USF_Account_Number__c, " +
            "(SELECT Id, FIS_Percent__c, EEC_Percent__c, ESF_Percent__c, Effective_Date__c, Fee_Type__c " +
            "FROM Fee_Agreements__r WHERE Active__c = True AND Effective_Date__c <= TODAY Limit 10) " +
            "FROM Account " +
            "WHERE Id = '" +
            accountId +
            "'";
        conn
            .query(accountQuery)
            .then(async(accountResult) => {
                if (this.DEBUG) {
                    console.log("account result", accountResult);
                }

                let duration = "";
                let orderType = "";
                let subOrderType = "";
                let emergency = ""
                let startDate = "";
                let endDate = "";
                let accountNumber = "";
                let customerSegment = "";
                let customerTier = "";
                let businessType = "";
                let acquisitionCode = "";
                let locationCode = "";
                let shipToZip = "";
                let salesArea = "";
                let parentAccountNumber = "";
                let ordered = false;
                let fisPercent;
                let eecPercent;
                let esfPercent;
                let isAdhoc = false;
                let isAmendment = false;
                let initialQuoteFIS;
                let initialQuoteEEC;
                let initialQuoteESF;
                let quoteNumber = '';
                let pricingHierarchyList: any[] = [];
                let count = 1;
                let daysInBillingPeriod = '';

                if (accountResult.totalSize > 0) {

                    let accountHierarchyValue = accountResult.records[0].Account_Hierarchy_List__c;
                    let ultimateParentAccount = (accountResult.records[0].Ultimate_Parent_Account__r != null) ? accountResult.records[0].Ultimate_Parent_Account__r.USF_Account_Number__c : null;
                    if(this.projectId !== undefined && this.projectId !== null ){
                        pricingHierarchyList.push({
                            objectType: 'Project',
                            priority: count,
                            id: this.projectId
                        });
                        count += 1;
                    }
                    pricingHierarchyList.push({
                        objectType: 'Account',
                        priority: count,
                        id: accountResult.records[0].USF_Account_Number__c
                    });
                    count += 1;
                    pricingHierarchyList = await this.getPricingHierarchy(accountHierarchyValue, conn, pricingHierarchyList, count, ultimateParentAccount);

                    subOrderType = quoteModel.record["Sub_Order_Type__c"];
                    emergency = quoteModel.record["Emergency__c"];
                    let durationResult = quoteModel.record["Duration__c"];
                    let startDateResult = quoteModel.record["SBQQ__StartDate__c"];
                    let endDateResult = quoteModel.record["SBQQ__EndDate__c"];
                    isAdhoc = (quoteModel.record["NF_Quote_Type__c"] != null && quoteModel.record["NF_Quote_Type__c"] == "AdHoc") ? true : false;
                    isAmendment = quoteModel.record["SBQQ__Type__c"] == "Amendment" ? true : false;
                    initialQuoteFIS = quoteModel.record["Fuel_Surcharge_Percent__c"];
                    initialQuoteEEC = quoteModel.record["EEC_Percent__c"];
                    initialQuoteESF = quoteModel.record["ESF_Percent__c"];
                    let orderTypeResult = (isAdhoc && this.parentQuoteType != null) ? this.parentQuoteType : quoteModel.record["Order_Type__c"];
                    daysInBillingPeriod = quoteModel.record["Billing_Period__c"];

                    console.log(
                        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>. GAAARY " +
                        quoteModel.record["SBQQ__StartDate__c"] +
                        " " +
                        quoteModel.record["SBQQ__EndDate__c"]
                    );
                    let customerTierResult =
                        accountResult.records[0].USS_Customer_Potential_Tier__c;

                    accountNumber = accountResult.records[0].USF_Account_Number__c;

                    if(accountResult.records[0].Fee_Agreements__r != null){
                        var feeAgreementList = accountResult.records[0].Fee_Agreements__r.records;
                        feeAgreementList.forEach((fa) => {
                            if(fa["Fee_Type__c"] === 'F&I'){
                                fisPercent = fa["FIS_Percent__c"];
                            }
                            else if(fa["Fee_Type__c"] === 'EEC'){
                                eecPercent = fa["EEC_Percent__c"];
                            }
                            else if(fa["Fee_Type__c"] === 'ESF'){
                                esfPercent = fa["ESF_Percent__c"];
                            }
                        });
                    }
                    customerSegment = quoteModel.record["Customer_Type__c"];
                    businessType = quoteModel.record["Business_Type__c"];
                    locationCode = quoteModel.record["Location_Code__c"];
                    shipToZip = quoteModel.record["Ship_Zip_Code__c"];
                    ordered = quoteModel.record["SBQQ__Ordered__c"];
                    salesArea = quoteModel.record["Sales_Area__c"];
                    parentAccountNumber = quoteModel.record["Parent_Account_Number__c"];
                    acquisitionCode = accountResult.records[0].Acquisition_Code_Name__c;
                    quoteNumber = quoteModel.record["Name"];

                    // If an account doesn't have a parent, the parent number is set to its own account number
                    if (this.DEBUG) {
                        console.log("account number: " + accountNumber);
                        console.log("parent account number: " + parentAccountNumber);
                    }
                    if (
                        parentAccountNumber &&
                        accountNumber.toLowerCase() === parentAccountNumber.toLowerCase()
                    ) {
                        parentAccountNumber = "";
                    }
                    if (!parentAccountNumber) {
                        parentAccountNumber = "";
                    }

                    if (this.DEBUG) {
                        console.log("sales area: ", salesArea);
                    }

                    if (!salesArea) {
                        salesArea = "";
                    }

                    if (!businessType) {
                        businessType = "";
                    }

                    if (!acquisitionCode) {
                        acquisitionCode = "";
                    }

                    if (!locationCode) {
                        locationCode = "";
                    }

                    orderType = this.ParseOrderType(orderTypeResult);
                    startDate = this.ParseDate(startDateResult);
                    endDate = this.ParseDate(endDateResult);
                    customerTier = this.ParseCustomerTier(customerTierResult);

                    if (durationResult) {
                        duration = this.ParseDuration(durationResult);
                    } else {
                        duration = "";
                    }
                }

                var validationErrors = [];
                if (duration.length === 0 && endDate.length === 0) {
                    validationErrors.push(
                        "Either duration or end date must be set on the quote"
                    );
                }
                if (startDate.length === 0) {
                    validationErrors.push("Start date must be set on the quote");
                }
                if (!accountNumber || accountNumber.length === 0) {
                    validationErrors.push("Account Number must be set on the account");
                }
                if (customerTier.length === 0) {
                    validationErrors.push("Customer Tier must be set on the quote");
                }
                if (locationCode.length === 0) {
                    validationErrors.push("Location code must be set on the quote");
                }

                // not used in this case
                if (orderType === "one-time" && !customerSegment) {
                    customerSegment = "business";
                }

                if (!customerSegment || customerSegment.length === 0) {
                    validationErrors.push(
                        "Customer Type required for recurring quotes."
                    );
                }

                let quoteLineMetaData = [];
                let assetCount = 0;
                let customerOwnedCount = 0;
                let adHocCount = 0;
                let totalAssetQuantity = 0;
                quoteLineModels.forEach((element) => {
                    const metaData = {
                        key: element["key"],
                        parentKey: element["parentItemKey"],
                        type: element.record["Product_Type__c"],
                        sku: element.record["SBQQ__ProductCode__c"],
                        requiresParent: element.record["Requires_Parent_Asset__c"],
                        description: element.record["SBQQ__Description__c"],
                        serviceCount: element.record["Product_Number_Services__c"],
                        serviceType: element.record["Trailer_Service_Type__c"],
                    };
                    quoteLineMetaData.push(metaData);

                    if (element.record["Product_Type__c"].toLowerCase() === "asset") {
                        assetCount++;
                        let assetQuantity = element.record["SBQQ__Quantity__c"];
                        totalAssetQuantity += assetQuantity;
                    } else if (
                        element.record["Product_Type__c"].toLowerCase() ===
                        "customer owned"
                    ) {
                        customerOwnedCount++;
                    } else if (
                        element.record["Product_Type__c"].toLowerCase() === "adhoc"
                    ) {
                        adHocCount++;
                    }
                });

                const showCartLevelPickupDelivery =
                    assetCount > customerOwnedCount + adHocCount;

                if (this.DEBUG) {
                    console.log("quote line metadata", quoteLineMetaData);
                    console.log(
                        "show cart level pickup/delivery",
                        showCartLevelPickupDelivery
                    );
                }

                let quoteLines = [];
                quoteLineModels.forEach(function(line) {
                    const product = line.record["SBQQ__ProductCode__c"];
                    const productDescription = line.record["SBQQ__Description__c"];
                    const quantity = line.record["SBQQ__Quantity__c"];
                    const serviceType = line.record["Trailer_Service_Type__c"];
                    const lineKey = line["key"];

                    const metaInfo = quoteLineMetaData.filter(function(prop) {
                        return prop.key === lineKey;
                    });

                    let parentKey = 0;
                    if (metaInfo) {
                        if (metaInfo[0]["parentKey"]) {
                            parentKey = metaInfo[0]["parentKey"];
                        } else {
                            parentKey = metaInfo[0]["key"];
                        }
                    }

                    let assetInfo = [];
                    try {
                        assetInfo = quoteLineMetaData.filter((prop) => {
                            const parentBundleKey = USSQuoteCalculatorPlugin.GetParentBundleKey(
                                parentKey,
                                quoteLineMetaData
                            );
    
                            return (
                                prop.type.toLowerCase() === "asset" &&
                                prop.parentKey &&
                                prop.parentKey === parentBundleKey
                            );
                        });
                    } catch (error) {
                        console.log(error);
                    }
                    

                    const isCustomerOwned = quoteLineMetaData.filter(function(prop) {
                        const parentBundleKey = USSQuoteCalculatorPlugin.GetParentBundleKey(
                            parentKey,
                            quoteLineMetaData
                        );
                        return (
                            prop.type.toLowerCase() === "customer owned" &&
                            prop.parentKey &&
                            prop.parentKey === parentBundleKey
                        );
                    });

                    const isAdHoc = quoteLineMetaData.filter(function(prop) {
                        const parentBundleKey = USSQuoteCalculatorPlugin.GetParentBundleKey(
                            parentKey,
                            quoteLineMetaData
                        );
                        return (
                            prop.type.toLowerCase() === "adhoc" &&
                            prop.parentKey &&
                            prop.parentKey === parentBundleKey
                        );
                    });

                    let customerOwned = isCustomerOwned && isCustomerOwned.length > 0;
                    let adHoc = isAdHoc && isAdHoc.length > 0;

                    if (metaInfo && !metaInfo[0]["parentKey"]) {
                        customerOwned = !showCartLevelPickupDelivery;
                    }

                    let requiresParent = false;
                    let assetSku = "";
                    if (metaInfo) {
                        requiresParent = metaInfo[0]["requiresParent"];
                        if (requiresParent) {
                            if (assetInfo && assetInfo.length > 0) {
                                assetSku = assetInfo[0].sku;
                            }
                        }
                    }

                    let quoteLine = {
                        "account": accountNumber,
                        "quoteNumber": quoteNumber,
                        "product": product,
                        "customerSegment": customerSegment,
                        "businessType": businessType,
                        "customerTier": customerTier,
                        "locationCode": locationCode,
                        "quantity": quantity,
                        "startDate": startDate,
                        "endDate": endDate,
                        "eventOrRecurring": orderType,
                        "subOrderType": subOrderType,
                        "isEmergency": emergency,
                        "projectDuration": duration,
                        "assetSku": assetSku,
                        "acquisitionCode": acquisitionCode,
                        "shipToZip": shipToZip,
                        "salesArea": salesArea,
                        "isCustomerOwned": customerOwned || adHoc,
                        "parentAccountNumber": parentAccountNumber,
                        "numberOfAssets": assetCount,
                        "assetQuantity": totalAssetQuantity,
                        "serviceType": serviceType,
                        "lineKey": lineKey,
                        "daysInBillingPeriod": daysInBillingPeriod,
                    };
                    quoteLines.push(quoteLine);
                });

                quoteLineModels.forEach(function(line) {
                    console.log(
                        "onAfterCalculate Product_Type__c=>",
                        line.record["Product_Type__c"]
                    );
                    console.log(
                        "onAfterCalculate SBQQ__ProductName__c=>",
                        line.record["SBQQ__ProductName__c"]
                    );
                    console.log("onAfterCalculate Id =>", line.record["Id"]);
                    console.log(
                        "onAfterCalculate Trailer_Service_Type__c=>",
                        line.record["Trailer_Service_Type__c"]
                    );
                    console.log(
                        "onAfterCalculate SBQQ__RequiredBy__c=>",
                        line.record["SBQQ__RequiredBy__c"]
                    );
                    console.log(
                        "onBeforeCalculate parentGroupKey =>",
                        line.record["parentGroupKey"]
                    );
                    console.log(
                        "onBeforeCalculate parentItemKey =>",
                        line.record["parentItemKey"]
                    );
                    console.log("onBeforeCalculate key =>", line.record["key"]);
                    console.log(
                        "onBeforeCalculate SBQQ__StartDate__c => " +
                        line.record["SBQQ__StartDate__c"]
                    );
                    console.log(
                        "onBeforeCalculate SBQQ__EndDate__c => " +
                        line.record["SBQQ__EndDate__c"]
                    );

                    console.log(" Start Date " + typeof startDate);
                    console.log(" Start Date " + typeof endDate);
                });

                if (this.DEBUG) {
                    console.log("validation errors", validationErrors);
                }

                if (validationErrors.length > 0) {
                    let errorMessage =
                        "One or more errors are preventing price generation: \\n";
                    let index = 0;
                    validationErrors.forEach(function(error) {
                        if (index > 0) {
                            errorMessage = errorMessage + "\\n";
                        }
                        index++;
                        errorMessage = errorMessage + " - " + error;
                    });
                    errorMessage =
                        errorMessage + "\\n\\nPlease press Cancel and fix these errors.";

                    if (DEBUG) {
                        console.log("error message: ", errorMessage);
                    }
                }

                let payload = {
                    "ModelInputs": {
                        "quoteLines": quoteLines,
                    "pricingHierarchy": pricingHierarchyList
                    }
                };

                if (DEBUG) {
                    console.log("payload", payload);
                    console.log("payload JSON", JSON.stringify(payload));
                }

                if (quoteLines.length == 0) {
                    resolve();
                }

                if (validationErrors.length === 0) {
                    conn.apex.post("/getPricing", payload, function (err, res) {
                        console.log("getPricing response: ", res);
                        let calcResponse = JSON.parse(res.body);
                        if (DEBUG) {
                            console.log("calc response", calcResponse);
                            console.log("json calc response", JSON.stringify(calcResponse));
                        }

                        if (calcResponse.error) {
                            reject(
                                "error in calculation - " +
                                calcResponse.error.description
                            );
                        }

                        const calculatedQuoteLines = calcResponse.data.calculatedLines;

                        if (DEBUG) {
                            console.log("calculatedQuoteLines", calculatedQuoteLines);
                        }

                        let eecRate = 0;
                        let esfRate = 0;
                        let fisRate = 0;
                        let newSVCChargeType = "Recurring";

                        if (quoteModel.record["Service_Type__c"] == "Usage")
                            newSVCChargeType = "Usage";

                        quoteLineModels.forEach(function(line) {
                            let serviceDenominator = 1;

                            const productCode = line.record["SBQQ__ProductCode__c"];
                            const productFamily = line.record["SBQQ__ProductFamily__c"];

                            let isWinterLine = false;

                            if (productCode == "113-3401" || productCode == "123-3401" || productCode == "133-3401") {
                                isWinterLine = true;
                            }
                            const lineKey = line["key"];
                            if (line.record["Charge_Type_Usage__c"] == true && line.record["SBQQ__ChargeType__c"] != newSVCChargeType) {
                                console.log("***Line inside***");
                                line.record["SBQQ__ChargeType__c"] = newSVCChargeType;
                            }

                            if (line.record["SBQQ__ChargeType__c"] == "Usage") {
                                serviceDenominator =
                                    line.record["Product_Number_of_Service_s__c"];
                            }

                            let lineItem = null;
                            if (calculatedQuoteLines.some(line => line.lineKey === lineKey)) {
                                lineItem = calculatedQuoteLines.filter(line => line.lineKey === lineKey)[0];
                            }

                            if (lineItem !== null) {

                                let targetPrice = (Math.round((lineItem.targetPrice + Number.EPSILON) * 100) / 100);


                                let floorPrice = (Math.round((lineItem.floorPrice + Number.EPSILON) * 100) / 100);

                                let optimalPrice = (Math.round((lineItem.optimalPrice + Number.EPSILON) * 100) / 100);

                                if (quoteModel.record["Service_Type__c"] == "Usage") {
                                    targetPrice = (isWinterLine ? 0 : Math.round(((lineItem.targetPrice + Number.EPSILON) / serviceDenominator) * 100) / 100);
                                    floorPrice = (isWinterLine ? 0 : Math.round(((lineItem.floorPrice + Number.EPSILON) / serviceDenominator) * 100) / 100);
                                    optimalPrice = (isWinterLine ? 0 : Math.round(((lineItem.optimalPrice + Number.EPSILON) / serviceDenominator) * 100) / 100);

                                    if (isWinterLine) {
                                        // On Usage Order, set the Winter line to Zero for Price Override. //TODO: Consolidate this logic to be more clean
                                        line.record["Price_Override__c"] = 0;
                                        line.record["SBQQ__NetPrice__c"] = 0;
                                    }
                                }

                                if(!isAdhoc && !isAmendment){
                                    fisRate = (fisPercent !== undefined && fisPercent !== null && fisPercent >= 0) ? fisPercent : parseFloat(lineItem.fuelSurchargeRate.toFixed(3));
                                    eecRate = (eecPercent !== undefined && eecPercent !== null && eecPercent >= 0) ? eecPercent : parseFloat(lineItem.finalEECRate.toFixed(3));
                                    esfRate = (esfPercent !== undefined && esfPercent !== null && esfPercent >= 0) ? esfPercent : parseFloat(lineItem.finalESFRate.toFixed(3));
                                }
                                else {
                                    fisRate = initialQuoteFIS;
                                    eecRate = initialQuoteEEC;
                                    esfRate = initialQuoteESF;
                                }

                                let isContract = lineItem.pricingUsed === "contract" ? true : false;

                                if (DEBUG) {
                                    console.log("*** Product Code ***");
                                    console.log(productCode);
                                }
                                if (isWinterLine && quoteModel.record["Service_Type__c"] == "Recurring") {
                                    if (DEBUG) {
                                        console.log("*** Inside Winter Logic ***");
                                    }
                                    const lineKey = line["key"];
                                    const metaInfo = quoteLineMetaData.filter(
                                        function(prop) {
                                            return prop.key === lineKey;
                                        }
                                    );

                                    let parentKey = 0;
                                    if (metaInfo) {
                                        if (metaInfo[0]["parentKey"]) {
                                            parentKey = metaInfo[0]["parentKey"];
                                        } else {
                                            parentKey = metaInfo[0]["key"];
                                        }
                                    }

                                    const serviceInfo = quoteLineMetaData.filter(
                                        function(prop) {
                                            const parentBundleKey = USSQuoteCalculatorPlugin.GetParentBundleKey(
                                                parentKey,
                                                quoteLineMetaData
                                            );

                                            return (
                                                prop.type.toLowerCase() === "service" &&
                                                prop.parentKey &&
                                                prop.parentKey === parentBundleKey
                                            );
                                        }
                                    );

                                    if (DEBUG) {
                                        console.log(serviceInfo);
                                    }

                                    let serviceCount = 1;
                                    if (serviceInfo && serviceInfo.length > 0) {
                                        serviceCount = serviceInfo[0].serviceCount;
                                    }

                                    targetPrice = (Math.round((lineItem.targetPrice + Number.EPSILON) * 100) / 100) * serviceCount;
                                    floorPrice = (Math.round((lineItem.floorPrice + Number.EPSILON) * 100) / 100) * serviceCount;
                                    optimalPrice = (Math.round((lineItem.optimalPrice + Number.EPSILON) * 100) / 100) * serviceCount;
                                    if (DEBUG) {
                                        console.log(serviceCount);
                                        console.log(targetPrice);
                                        console.log("*** END Winter Logic ***");
                                    }
                                }

                                line.record["Target_Price__c"] = targetPrice;
                                line.record["SBQQ__SpecialPrice__c"] = targetPrice;
                                line.record["Floor_Price__c"] = floorPrice;
                                line.record["Optimal_Price__c"] = optimalPrice;
                                line.record["IS2PContractedPrice__c"] = isContract;

                                //US-0008599 code change starts here
                                if (isContract == true) {
                                    line.record["Price_Override__c"] = targetPrice;
                                }
                                //US-0008599 code change ends here

                                // Use the Special price Description to store JSON Object to hold info about Line pricing
                                let quoteType = quoteModel.record["SBQQ__Type__c"];
                                let upgradesSub = line.record["SBQQ__UpgradedSubscription__c"];

                                if (line.record["Line_Details__c"] == null && (quoteType == "Quote" || (quoteType == "Amendment" && upgradesSub == null))) {
                                    console.log("enter if $$$$ ");

                                    if (DEBUG) {
                                        console.log("Setting price initially from I2P");
                                    }

                                    line.record["Price_Override__c"] = targetPrice;
                                    line.record["SBQQ__NetPrice__c"] = targetPrice;

                                    var currentData = {
                                        pc: line.record["SBQQ__ProductCode__c"],
                                        pt: line.record["Product_Type__c"],
                                        ps: "I2P",
                                        qc: newSVCChargeType,
                                        po: targetPrice,
                                    };
                                    line.record["Line_Details__c"] = JSON.stringify(currentData);
                                } else {
                                    console.log("enter else $$$$ ");

                                    var prevData = JSON.parse(
                                        line.record["Line_Details__c"]
                                    );
                                    if (prevData != null) {
                                        // Reset the prices from I2P when Service Type changes
                                        if (prevData.qc != newSVCChargeType) {
                                            line.record["Price_Override__c"] = targetPrice;
                                            line.record["SBQQ__NetPrice__c"] = targetPrice;
                                            prevData.ps = "I2P";
                                            prevData.qc = newSVCChargeType;
                                            prevData.po = targetPrice;
                                        } else {
                                            // Check if user overwrote the price
                                            if (line.record["Price_Override__c"] != targetPrice && prevData.po == targetPrice) {
                                                prevData.ps = "User";
                                                prevData.po = line.record["Price_Override__c"];
                                            } else if (line.record["Price_Override__c"] === targetPrice && prevData.po !== line.record["Price_Override__c"]) { //Added by Medea for US-0008794
                                                prevData.ps = 'User';
                                                prevData.po = line.record["Price_Override__c"];
                                                line.record["Price_Overridden__c"] = true;
                                            } //End of Added by Medea for US-0008794
                                            else {
                                                // Price is updated by I2P eg via change in quantity (Once price is changed by user then do not revert it back)
                                                if (prevData.ps != "User" && (quoteType == "Quote" || (quoteType == "Amendment" && upgradesSub == null))) {
                                                    prevData.po = targetPrice;
                                                    prevData.ps = "I2P";
                                                    line.record["Price_Override__c"] = targetPrice;
                                                }
                                            }
                                        }
                                        line.record["Line_Details__c"] = JSON.stringify(prevData);
                                    }
                                }

                                console.log("line $$$$ " + JSON.stringify(line.record["Line_Details__c"]));
                                console.log("floorPrice::" + floorPrice + "::targetPrice::" + targetPrice + "::optimalPrice::" + optimalPrice);
                            }
                        });

                        if (DEBUG) {
                            console.log("eec rate: ", eecRate);
                        }

                        if (DEBUG) {
                            console.log("esf rate: ", esfRate);
                        }

                        // Overwrite these every time with what is coming back from engine.
                        quoteModel.record["EEC_Percent__c"] = eecRate;
                        quoteModel.record["ESF_Percent__c"] = esfRate;
                        console.log('debug fisRate = ' + fisRate);
                        //DA changes
                        quoteModel.record["Fuel_Surcharge_Percent__c"] = fisRate;

                        let linesToCalculate = [];
                        quoteLineModels.forEach((lineItem) => {
                            if (!!lineItem.record.One_Time_Service_Type__c) {
                                linesToCalculate.push({
                                    key: lineItem.record.SBQQ__Number__c,
                                    startDate: lineItem.record.NF_Service_Start_Date__c || lineItem.record.SBQQ__StartDate__c,
                                    endDate: lineItem.record.NF_Service_End_Date__c || lineItem.record.SBQQ__EndDate__c,
                                    serviceType: lineItem.record.One_Time_Service_Type__c,
                                    serviceDays: lineItem.record.One_Time_Service_Day_s__c,
                                    bundleId: lineItem.record.SBQQ__RequiredBy__c,
                                    multiplier: lineItem.record.SBQQ__Product__r.Number_of_Services__c || 1,
                                    quantity: lineItem.record.SBQQ__Quantity__c
                                });
                            }
                        });

                        conn.apex.post('/CalculateQuoteServiceCount/', {
                            quoteLinesJSON: JSON.stringify(linesToCalculate)
                        }, function(err, serviceLineMap) {
                            quoteLineModels.forEach((lineItem) => {
                                if (lineItem.record.SBQQ__Number__c in serviceLineMap) {
                                    lineItem.record.SBQQ__Quantity__c = serviceLineMap[lineItem.record.SBQQ__Number__c];
                                    lineItem.record.SBQQ__BundledQuantity__c = serviceLineMap[lineItem.record.SBQQ__Number__c];
                                }
                            });

                            resolve();
                        });
                        // PIT-488
                        USSQuoteCalculatorPlugin.calculateTotals(quoteModel, quoteLineModels);
                        });
                } else {
                    const priceMessage = "Price request not fired, validation errors prevent payload from being generated correctly.";
                    console.warn(priceMessage);
                    this.logInfo(priceMessage, quoteModel, conn);
                    resolve();
                }
            })
            .catch((err) => {
                console.warn("Could not query records", err);
                this.logInfo('Could not query records', quoteModel, conn);
                resolve();
            });
    });
}

private ParseDuration (duration): string{
    const replaced = duration.replace(/[^0-9\.]/g, " ");
    const numbers = replaced.split(" ").filter(function(e) {
        return e;
    });

    return numbers.length > 0 ? numbers[numbers.length - 1] : 0;
};

private ParseOrderType(orderType): string {
    if (orderType === null) {
        return "recurring";
    }

    if (orderType.toLowerCase().indexOf("one-time") === -1) {
        return "recurring";
    }

    return "one-time";
};

private ParseDate (dt): string {
    let formatted = "";
    if (dt) {
        var d = new Date(dt);
        if (d instanceof Date && !isNaN(d.valueOf())) {
            formatted = d.getUTCMonth() + 1 + "/" + d.getUTCDate() + "/" + d.getUTCFullYear();
        }
    }

    return formatted;
};

private ParseCustomerTier (tier): string {
    if (!tier || tier.length === 0) {
        return "D";
    }

    return tier.replace("+", "").trim().toUpperCase();
};

public static GetParentBundleKey(key, quoteLineMetaData): string {
    let currentLine = quoteLineMetaData.filter(function(prop) {
        return prop.key === key;
    });

    if (!currentLine) {
        return key;
    }

    if (!currentLine[0]["parentKey"]) {
        return currentLine[0]["key"];
    }

    return USSQuoteCalculatorPlugin.GetParentBundleKey(currentLine[0]["parentKey"], quoteLineMetaData);
};

public static inArray(a, obj): boolean {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
};

// PIT-488 - Increment this function as needed to add default values for a field for the first time. Try to always perform some sort of check on each field to avoid keep reseting it on every calc.
public setDefaults(quoteModel, quoteLineModel) {
    quoteLineModel.forEach((lineItem) => {
        if (!lineItem.record.SBQQ__ChargeType__c) {
            lineItem.record.SBQQ__ChargeType__c = this.evaluateLineItemChargeType(lineItem, quoteModel);
        }
        if (lineItem.record.Houston_Franchise_Fees_Percent__c == null) { // loose eq op to take 0 (zero) out of condition and treat null and undef as the same
            lineItem.record.Houston_Franchise_Fees_Percent__c = this.calculateHFFPercent(lineItem, quoteModel);
        }
    });
}
// PIT-488
public calculateHFFPercent(lineItem, quoteModel) {
    let hffPercent = 0;
    if (lineItem.record.SBQQ__Product__r.Apply_Houston_Franchise_Fee__c) {
        if (this.hffZipcodes.includes(quoteModel.record.SBQQ__ShippingPostalCode__c)) {
            hffPercent = quoteModel.record.HFF_Predefined_Percent__c;
        } else {
            hffPercent = 0;
        }
    } else {
        hffPercent = 0;
    }
    return hffPercent;
}
// PIT-488 - This method contains the merged logic from methods setChargeTypeOnLines() and setChargeTypeOnServiceLines() from QuoteLineItemService
public evaluateLineItemChargeType(lineItem, quoteModel) {
    const isOneTimeProd = lineItem.record.SBQQ__Product__r.Charge_Type_One_Time__c;
    const isRecurringProd = lineItem.record.SBQQ__Product__r.Charge_Type_Recurring__c;
    const isUsageProd = lineItem.record.SBQQ__Product__r.Charge_Type_Usage__c;
    const prodSubscrType = lineItem.record.SBQQ__Product__r.SBQQ__SubscriptionType__c;
    const prodType = lineItem.record.SBQQ__Product__r.ProductType__c;
    
    if (isUsageProd && !isRecurringProd && !isOneTimeProd) {
        return "Usage";
    } 
    if ((prodSubscrType && prodSubscrType.toUpperCase() === "ONE-TIME") || (quoteModel.record.Charge_Type__c && quoteModel.record.Charge_Type__c.toUpperCase() === "ONE-TIME")) {
        return "One-Time";
    } 
    if (prodType === "Service" && isUsageProd) {
        return quoteModel.record.Service_Type__c ? "Recurring" : quoteModel.record.Service_Type__c;
    } 
    return quoteModel.record.Charge_Type__c;
}

// PIT-488 - Increment this function as needed to perform final calculations for totals, rollups and applicable logic that shall run after main pricing impacting fields have been manipulated
public static calculateTotals(quoteModel, quoteLineModel) {
    quoteLineModel.forEach((lineItem) => {
        USSQuoteCalculatorPlugin.calculateTCV(lineItem, quoteModel);
    });
}
// PIT-488
public static calculateTCV(lineItem, quoteModel) {
    let tcv = 0;
    const ussNet = lineItem.record.SBQQ__ChargeType__c === "Usage" ? 0 : lineItem.record.Price_Override__c * lineItem.record.SBQQ__Quantity__c;
    const eecCharge = lineItem.record.SBQQ__ChargeType__c === "Usage" ? 0 : USSQuoteCalculatorPlugin.round(lineItem.record.Price_Override__c * lineItem.record.EEC_Percent__c / 100, 2) * lineItem.record.SBQQ__Quantity__c;
    const esfCharge = lineItem.record.SBQQ__ChargeType__c === "Usage" ? 0 : USSQuoteCalculatorPlugin.round(lineItem.record.Price_Override__c * lineItem.record.ESF_Percent__c / 100, 2) * lineItem.record.SBQQ__Quantity__c;
    const fuelCharge = lineItem.record.SBQQ__ChargeType__c === "Usage" ? 0 : USSQuoteCalculatorPlugin.round(lineItem.record.Price_Override__c * lineItem.record.Fuel_Surcharge_Percent__c / 100, 2) * lineItem.record.SBQQ__Quantity__c;
    const hffCharge = lineItem.record.Price_Override__c * (lineItem.record.Houston_Franchise_Fees_Percent__c / 100) * lineItem.record.SBQQ__Quantity__c; // Round explicity not applied to keep sync with source apex logic that doesn't round it
    const netCharge = ussNet + eecCharge + esfCharge + fuelCharge + hffCharge;
    
    if (quoteModel.record.Order_Type__c !== "Recurring without End Date" && netCharge > 0 && !lineItem.record.Product_Exclude_From_TCV__c && lineItem.record.SBQQ__StartDate__c && lineItem.record.SBQQ__EndDate__c) {
        if (lineItem.record.SBQQ__ChargeType__c === "One-Time") {
            tcv = netCharge;
        } else if (lineItem.record.SBQQ__ChargeType__c === "Recurring") {
            const startDate = new Date(lineItem.record.SBQQ__StartDate__c);
            const endDate = new Date(lineItem.record.SBQQ__EndDate__c);
            if (quoteModel.record.Billing_Period__c === "28 Day Bill Period") {
                const totalPeriodInDays = (endDate.valueOf() - startDate.valueOf()) / (1000 * 60 * 60 * 24) + 1; //(1000 * 60 * 60 * 24) is to convert from miliseconds (result of dates subtraction) to days
                tcv = (netCharge / 28) * totalPeriodInDays;
            } else {
                const daysFirstMonth = USSQuoteCalculatorPlugin.getDaysInMonth(startDate.getUTCFullYear(), startDate.getUTCMonth());
                const daysLastMonth = USSQuoteCalculatorPlugin.getDaysInMonth(endDate.getUTCFullYear(), endDate.getUTCMonth());
                
                const firstMonthProration = (startDate.getUTCDate() === 1 ? 0 : daysFirstMonth - startDate.getUTCDate() + 1 + (startDate.getUTCFullYear() === endDate.getUTCFullYear() && startDate.getUTCMonth() === endDate.getUTCMonth() ? endDate.getUTCDate() - daysLastMonth: 0)) / daysFirstMonth;
                const firstMonthTCV = netCharge * firstMonthProration;
                
                const fullMonths = Math.max((12 * (endDate.getUTCFullYear() - startDate.getUTCFullYear()) + ((endDate.getUTCDate() === daysLastMonth ? endDate.getUTCMonth() + 1 : endDate.getUTCMonth()) - (startDate.getUTCDate() === 1 ? startDate.getUTCMonth() : startDate.getUTCMonth() + 1))), 0);
                const fullMonthsTCV = netCharge * fullMonths;
                
                const lastMonthProration = ((endDate.getUTCDate() === daysLastMonth || (startDate.getUTCFullYear() === endDate.getUTCFullYear() && startDate.getUTCMonth() === endDate.getUTCMonth())) ? 0 : endDate.getUTCDate() / daysLastMonth);
                const lastMonthTCV = netCharge * lastMonthProration;
                
                tcv = firstMonthTCV + fullMonthsTCV + lastMonthTCV;
            }
        }
    }
    lineItem.record.TCV__c = tcv;
}
// PIT-488
public static round(value, scale) {
    const scaleModifier = Math.pow(10, scale);
    return Math.round((value + Number.EPSILON) * scaleModifier) / scaleModifier;
}
// PIT-488 - month shall be the JS zero-based index for the month
public static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getUTCDate();
}

public getPricingHierarchy(accountHierarchyValue, conn, pricingHierarchyList: any[], count, ultimateParentAccount): Promise<any[]>{
    let pricingList = [];
    if(accountHierarchyValue != null){
        let accountHierarchyList = accountHierarchyValue.split("|");
        accountHierarchyList.forEach(accNum => {  
            if(accNum != null && accNum != ""){  
                pricingList.push({
                    objectType: 'Account',
                    priority: count,
                    id: accNum
                });
                count += 1;
            }
        })
        pricingHierarchyList.push(...pricingList);
        if(pricingList.length === 5 && pricingList[4].id != null){
            const parentAccQuery = "SELECT Id, Account_Hierarchy_List__c FROM Account WHERE USF_Account_Number__c = '" +
            pricingList[4].id + "'";
            conn
            .query(parentAccQuery)
            .then((parentAccResult) => {
                this.getPricingHierarchy( parentAccResult.records[0].Account_Hierarchy_List__c, conn, pricingHierarchyList, count, ultimateParentAccount);
            });
        }
        let hasUltimateParent = pricingHierarchyList.some( ele => ele['id'] == ultimateParentAccount );
        if(ultimateParentAccount != null && !hasUltimateParent){
            pricingHierarchyList.push({
                objectType: 'Account',
                priority: count,
                id: ultimateParentAccount
            });
            count += 1;
        }
    }
    return new Promise((resolve, reject) => {
        resolve(pricingHierarchyList);
    });
  }
}