import { LightningElement, track, api } from 'lwc';

export default class OppProductSelector extends LightningElement {

    @api recordId;
    @api recordTypeName;
    @api pricebookId;

    @track filterBtnLable = 'Hide Filters';
    @track filterCls = 'slds-col slds-size_1-of-4';
    @track productCls = 'slds-col slds-size_3-of-4';

    handleAddProducts() {

        this.template.querySelector('c-product-list').loadSpinner();
        this.template.querySelector('c-product-list').createOppLineItems();
    }

    handleFilterUpdate(event) {
        this.template.querySelector('c-product-list').updateFilters(event.detail);
    }

    handleLineItemListUpdate() {

        this.dispatchEvent(
            new CustomEvent('opplineitemsupdate')
        );
    }

    handleFilterAction() {

        if (this.filterBtnLable == 'Hide Filters') {

            this.filterCls = 'slds-hide';
            this.productCls = 'slds-col';
            this.filterBtnLable = 'Show Filters';
        }
        else {

            this.filterCls = 'slds-col slds-size_1-of-4';
            this.productCls = 'slds-col slds-size_3-of-4';
            this.filterBtnLable = 'Hide Filters';
        }
    }
}