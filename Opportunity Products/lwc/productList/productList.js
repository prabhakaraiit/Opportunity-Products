import { LightningElement, track, api, wire } from 'lwc';

import getProductColumn from "@salesforce/apex/ProductListCtrl.getProductColumns";
import getProductsCount from "@salesforce/apex/ProductListCtrl.getProductsCount";
import getProductsList from '@salesforce/apex/ProductListCtrl.getProducts';
import createOppLineItems from '@salesforce/apex/ProductListCtrl.createOppLineItems';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ProductList extends LightningElement {

    rowOffset = 0;
    Max_Offset = 2000;
    totalNumberOfRows = 0;
    isProductLoading = false;

    @api recordId;
    @api pricebookId;
    @api recordTypeName;


    @track preSelectedRows = [];
    @track filters = '';
    @track productList = [];
    @track columns = [];
    @track sortBy = 'Name';
    @track sortDirection = 'ASC';
    @track isLoading = false;
    @track loadMoreStatus;
    @track infiniteLoading = true;

    @track error;
    @track selectedProd;
    @track fieldAPINames = [];


    connectedCallback() {
        this.isLoading = true;
    }


    //@wire(CurrentPageReference) pageRef;

    @wire(getProductColumn)
    productColumns({ error, data }) {

        if (error) {
            this.error = error;
        } else if (data) {

            let apinames = [];
            let dataColumn = [];
            data.forEach(function (pcolumn) {


                let apiname = '';

                if (pcolumn.Field_API_Name__c == 'UnitPrice')
                    apiname = pcolumn.Field_API_Name__c;
                else
                    apiname = 'Product2.' + pcolumn.Field_API_Name__c;

                if (pcolumn.Field_Type__c == 'Date') {

                    let col = {
                        label: pcolumn.Label, fieldName: pcolumn.Field_API_Name__c, type: "date-local", sortable: true, typeAttributes: {
                            month: "2-digit",
                            day: "2-digit"
                        }
                    };
                    dataColumn.push(col);
                }
                else {

                    if (apiname == 'Product2.Name') {

                        let col = { label: pcolumn.Label, fieldName: pcolumn.Field_API_Name__c, type: pcolumn.Field_Type__c.toLowerCase(), sortable: true, wrapText: true };
                        dataColumn.push(col);
                    }
                    else {

                        let col = { label: pcolumn.Label, fieldName: pcolumn.Field_API_Name__c, type: pcolumn.Field_Type__c.toLowerCase(), sortable: true };
                        dataColumn.push(col);
                    }

                }

                apinames.push(apiname);

            });

            this.columns = dataColumn;
            this.fieldAPINames = apinames;
        }
    }

    @wire(getProductsCount, { pricebookId: '$pricebookId', filters: '$filters' })
    fetchProductCount({ error, data }) {

        if (error) {
            this.error = error;

        } else if (data) {

            this.totalNumberOfRows = data;
        }
    }

    @wire(getProductsList, { pricebookId: '$pricebookId', fields: '$fieldAPINames', filters: '$filters', sortBy: '$sortBy', sortDir: '$sortDirection', offset: 0 })
    productSelectorList({ error, data }) {

        if (error) {
            this.error = error.body.exceptionType + ': ' + error.body.message;
            this.productList = undefined;
        } else if (data) {

            if (data.length <= 0) {

                this.error = 'No Product Found.'
                this.productList = undefined;
            }
            else {
                let prodData = Object.assign([], data);

                this.productList = [];
                this.productList = this.getProductsData(prodData);
                this.error = undefined;
            }
        }

        this.rowOffset = 0;
        this.infiniteLoading = true;
        this.loadMoreStatus = '';
        this.isLoading = false;
        this.isProductLoading = true;

        this.delayLoadMore();
    }

    @api
    loadSpinner() {

        this.isLoading = true;
    }

    updateColumnSorting(event) {

        this.isLoading = true;

        let fieldName = event.detail.fieldName;
        let sortDirection = event.detail.sortDirection;
        //assign the values. This will trigger the wire method to reload.
        this.sortBy = fieldName;
        this.sortDirection = sortDirection;
    }

    @api
    updateFilters(filters) {

        this.isLoading = true;
        this.productList = undefined;
        console.log('====updateFilters in product list==', this.filters);
        this.filters = JSON.stringify(filters);

    }

    loadMoreData(event) {

        if (event == undefined) return;

        const { target } = event;

        if (this.isProductLoading) return;

        //Display a spinner to signal that data is being loaded
        target.isLoading = true;
        //Display "Loading" when more data is being loaded
        this.loadMoreStatus = 'Loading';

        let updatedOffset = this.rowOffset + 50;
        let productCount = 0;

        if (this.productList != undefined && this.productList != null)
            productCount = this.productList.length;

        if (productCount >= this.totalNumberOfRows) {

            this.infiniteLoading = false;
            target.isLoading = false;
            this.loadMoreStatus = 'No more data to load';
        }
        else {

            if (updatedOffset <= this.Max_Offset) {

                this.rowOffset = updatedOffset;

                this.loadRecords()
                    .then(() => {

                        target.isLoading = false;
                        this.loadMoreStatus = '';
                    });
            }
            else {

                this.infiniteLoading = false;
                this.loadMoreStatus = 'Add more filters to load data';
            }
        }

        this.isProductLoading = true;

        this.delayLoadMore();
    }

    loadRecords() {

        let flatData;
        return getProductsList({ pricebookId: this.pricebookId,  fields: this.fieldAPINames, filters: this.filters, sortBy: this.sortBy, sortDir: this.sortDirection, offset: this.rowOffset })
            .then(result => {

                let prodData = Object.assign([], result);

                flatData = this.getProductsData(prodData);

                let updatedRecords = [...this.productList, ...flatData];

                this.productList = updatedRecords;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
            })
    }

    @api
    createOppLineItems() {

        this.selectedProd = [];

        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        let selectedRowIds = [];

        selectedRows.forEach(function (row) {
            selectedRowIds.push(row.Id);
        });

        if (selectedRowIds.length == 0) {

            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'No Product Selected.',
                    variant: 'error',
                }),
            );

            return;
        }


        this.selectedProd = selectedRowIds;

        var prodIds = JSON.stringify(this.selectedProd);

        createOppLineItems({ oppId: this.recordId, pricebookId: this.pricebookId, lstPBEIds: prodIds })
            .then(result => {
                this.message = result;
                this.error = undefined;
                if (this.message !== undefined) {

                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Opportunity Lines created.',
                            variant: 'success',
                        }),
                    );

                    this.dispatchEvent(
                        new CustomEvent('lineitemlistupdate')
                    );

                }
            })
            .catch(error => {

                this.handleDMLError(error, 'Error creating Opportunity Lines.');
            });

        this.preSelectedRows = [];
        this.isLoading = false;
    }

    handleDMLError(error, errorTitle) {

        let errMessages = '';
        error.body.pageErrors.forEach(err => {
            errMessages += err.message + ' ';
        });

        this.dispatchEvent(
            new ShowToastEvent({
                title: errorTitle,
                message: errMessages,
                variant: 'error',
            }),
        );
    }


    getProductsData(prodData) {

        let rowColumns = this.columns;
        let prodRecords = [];

        prodData.forEach(function (sobj) {

            let newsobj = new Object();
            //newsobj.Id = sobj.Product2.Id;
            newsobj.Id = sobj.Id;
            rowColumns.forEach(function (col) {

                let fieldVal = '';
                let colField = col.fieldName;

                if (col.fieldName == 'UnitPrice')
                    fieldVal = sobj[colField];
                else
                    fieldVal = sobj.Product2[colField];

                newsobj[colField] = fieldVal;

            });

            prodRecords.push(newsobj);

        });

        return prodRecords;
    }

    delayLoadMore() {

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {

            this.isProductLoading = false;
        }, 1000);
    }
}