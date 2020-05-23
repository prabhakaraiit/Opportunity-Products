import { LightningElement, track, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getOppLineItems from '@salesforce/apex/OppProductController.getOppLines';
import deleteOppLineItems from '@salesforce/apex/OppProductController.deleteOppLineItems';
import saveOppLineItems from '@salesforce/apex/OppProductController.saveOppLineItems';

export default class OppProductList extends LightningElement {

    fixedWidth = "width:8rem;";
    smallFixedWidth = "width:2rem;"; 

    updatedOppLines = [];
    oppLineItems;

    @api recordId;
    @api recordTypeName;
    @api currencyCode;

    handleCancelJs(){

        console.log('======handleCancelJs===');
        const closeQA = new CustomEvent('close');
        this.dispatchEvent(closeQA);
    }


    @track defaultWrapHeader = true;
    @track oppLines;
    @track oppLineColumns;
    @track error;
    @track hasProducts;
    @track isLoading = false;

    @track sortBy = 'CreatedDate';
    @track sortDir = 'ASC';

    @wire(getOppLineItems, { strOppId: '$recordId', sortBy: '$sortBy', sortDir: '$sortDir' })
    getliLineItems(result) {

        console.log('=====getliLineItems start====', result);
        this.oppLineItems = result;
        this.assignlineItems(result);
        console.log('=====getliLineItems end====');
    }

    assignlineItems(result) {

        this.hasProducts = false;
        console.log('=====assignlineItems start====', result.data);
        console.log('=====assignlineItems start====', result.error);
        if (result.data) {

            this.oppLines = result.data.lstLineItems;
            this.oppLineColumns = result.data.lstColumns;
            this.error = undefined;

            if (this.oppLines.length > 0){

                this.hasProducts = true;
            }

        } else if (result.error) {

            this.error = result.error;
            this.oppLines = undefined;
            this.oppLineColumns = undefined;
        }

        console.log('=====assignlineItems end====', this.isLoading);
        this.isLoading = false;
        console.log('=====this.hasProducts=loading==', this.hasProducts);
    }
    

    handleWrapText(event) {

        let selectedItemValue = event.detail.value;

        let headerTitle = event.target.title;

        let sourceClassNames = event.target.className;
        let targetClassName = '.' + sourceClassNames.split(' ')[0];

        if (headerTitle == 'Product') {
            this.defaultWrapHeader = false;
        }

        let targetElements = this.template.querySelectorAll(targetClassName);

        targetElements.forEach(element => {

            if (selectedItemValue == 'wraptext')
                element.classList.add("slds-cell-wrap");
            else
                element.classList.remove("slds-cell-wrap");
        });
    }

    handleDeleteLines() {

        let selectedRowIds = this.getSelectedRows();
        if (selectedRowIds.length > 0) {
            this.template.querySelector('c-confirm-modal').show();
        }
        else {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least 1 row before Execution.',
                    variant: 'error',
                }),
            );
        }
    }

    @api
    refreshOppLines() {

        console.log('=====refreshOppLines====');
        this.isLoading = true;
        this.oppLines = undefined;
        return refreshApex(this.oppLineItems);
    }


    handleDmlResult(result, successMessage) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: successMessage,
                variant: 'success',
            }),
        );

        this.oppLines = result.lstLineItems;
        this.oppLineColumns = result.lstColumns;
        this.error = undefined;

        this.isLoading = false;
    }


    saveOppLineItemsJs() {

        if (this.updatedOppLines.length == 0) {

            this.showError('No updates found to commit changes.');
            return;
        }


        this.isLoading = true;
        //this.oppLines = undefined;

        saveOppLineItems({ lstLineItems: this.updatedOppLines })
            .then(result => {
                this.message = result;
                this.error = undefined;
                if (this.message !== undefined) {
                    this.handleSuccess('Opportunity Products Updated.');
                }
            })
            .catch(error => {
                this.message = undefined;
                this.handleError(error, 'Error updating the Opportunity Products');
                this.isLoading = false;
            });

    }

    deleteOppLineItemsJs() {

        this.isLoading = true;
        this.selectedLineItems = [];

        let selectedRows = this.template.querySelectorAll('.selectinput');

        for (let i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i].checked && selectedRows[i].type === 'checkbox') {
                this.selectedLineItems.push(selectedRows[i].dataset.id);
                selectedRows[i].checked = false;
            }
        }

        var opplineItemIds = JSON.stringify(this.selectedLineItems);

        deleteOppLineItems({ lstLineItemsIds: opplineItemIds })
            .then(result => {
                this.message = result;
                this.error = undefined;
                if (this.message !== undefined)
                    this.handleSuccess('Selected Opportunity Products deleted.');

            })
            .catch(error => {
                this.message = undefined;
                this.handleError(error, 'Error deleting Opportunity Products');
                this.isLoading = false;
            });
    }




    // Select the all rows
    allSelected(event) {
        let selectedRows = this.template.querySelectorAll('.selectinput');
        for (let i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i].type === 'checkbox') {
                selectedRows[i].checked = event.target.checked;
            }
        }
    }

    handleColumnUpdate(event) {

        let updatedSobj = event.detail;

        let hasSobj = false;

        this.updatedOppLines.forEach(sobj => {

            if (sobj.Id == updatedSobj.lineId) {

                let propName = updatedSobj.fieldName;
                let propVal = updatedSobj.fieldVal;
                sobj[propName] = propVal;

                hasSobj = true;
            }
        });

        if (!hasSobj) {

            let propName = updatedSobj.fieldName;
            let propVal = updatedSobj.fieldVal;

            let sobj = new Object();
            sobj.Id = updatedSobj.lineId;
            sobj[propName] = propVal;

            this.updatedOppLines.push(sobj);
        }
    }

    handleAddDiscountUpdate(event) {

        let updatedSobj = event.detail;
        let discType = event.detail.discType;

        let hasSobj = false;

        this.updatedOppLines.forEach(sobj => {

            if (sobj.Id == updatedSobj.lineId) {

                //let propName = updatedSobj.fieldName;
                let propVal = updatedSobj.fieldVal;

                if (discType == 'usd') {

                    sobj['Additional_Discount_Amount__c'] = propVal;
                    sobj['Additional_Discount_Percent__c'] = null;
                }
                else {

                    sobj['Additional_Discount_Amount__c'] = null;
                    sobj['Additional_Discount_Percent__c'] = propVal;
                }

                hasSobj = true;
            }
        });

        if (!hasSobj) {

            //let propName = updatedSobj.fieldName;
            let propVal = updatedSobj.fieldVal;

            let sobj = new Object();
            sobj.Id = updatedSobj.lineId;

            if (discType == 'usd') {

                sobj['Additional_Discount_Amount__c'] = propVal;
                sobj['Additional_Discount_Percent__c'] = null;
            }
            else {

                sobj['Additional_Discount_Amount__c'] = null;
                sobj['Additional_Discount_Percent__c'] = propVal;
            }

            this.updatedOppLines.push(sobj);
        }
    }

    getSelectedRows() {

        let selectedRows = this.template.querySelectorAll('.selectinput');

        let selectedRowIds = [];
        // based on selected row getting values of the contact
        for (let i = 0; i < selectedRows.length; i++) {
            if (selectedRows[i].checked && selectedRows[i].type === 'checkbox') {

                let rowId = selectedRows[i].dataset.id;
                selectedRowIds.push(rowId);
            }
        }

        return selectedRowIds;
    }

    handleError(error, errorTitle) {

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

    handleSuccess(successMessage) {

        this.refreshOppLines();

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: successMessage,
                variant: 'success',
            }),
        );
    }

    showError(errorMessage) {

        this.isLoading = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: errorMessage,
                variant: 'error',
            }),
        );
    }

    handleSorting(event) {

        this.isLoading = true;
        let headerTitle = event.target.title;

        if (headerTitle == this.sortBy) {

            this.sortDir = (this.sortDir == 'ASC') ? 'DESC' : 'ASC';
        }
        else {

            this.sortBy = headerTitle;
            this.sortDir = 'ASC';
        }

        let headerSortingCmp = this.template.querySelectorAll('c-header-sorting');

        headerSortingCmp.forEach(cmp => {
            cmp.reload(this.sortBy, this.sortDir);
        });

    }

    handleSortingUpdate(event) {

        this.isLoading = true;
        let headerTitle = event.detail;

        console.log('====headerTitle==', headerTitle);

        if (headerTitle == this.sortBy) {

            this.sortDir = (this.sortDir == 'ASC') ? 'DESC' : 'ASC';
        }
        else {

            this.sortBy = headerTitle;
            this.sortDir = 'ASC';
        }

        let headerSortingCmp = this.template.querySelectorAll('c-header-sorting');

        headerSortingCmp.forEach(cmp => {
            cmp.reload(this.sortBy, this.sortDir);
        });

    }
}