import { LightningElement, wire } from 'lwc';
import getProductFilters from '@salesforce/apex/ProductListCtrl.getProductFilters';

/** The delay used when debouncing event handlers before firing the event. */
const DELAY = 350;

export default class OppProductFilters extends LightningElement {

    selectedFilters = [];

    //@wire(CurrentPageReference) pageRef;
    @wire(getProductFilters) productFilters;

    handleReset() {

        this.selectedFilters = [];

        const event = new CustomEvent('filterupdate', {
            detail: this.selectedFilters
        });
        this.dispatchEvent(event);

        let productFilters = this.template.querySelectorAll('c-product-filter-item');

        productFilters.forEach(function (filter) {
            filter.resetFilters();
        });

    }

    handleFilterUpdate(event) {

        var isFilter = true;

        let updatedFilters = [];

        this.selectedFilters.forEach(function (filter) {

            if (filter.fieldApiName == event.detail.fieldApiName) {

                filter.fieldvalue = event.detail.fieldvalue;
                isFilter = false;
            }

            if (filter.fieldvalue != null && filter.fieldvalue != undefined)
                updatedFilters.push(filter);
        });


        if (isFilter) {

            var filterItem = {
                fieldApiName: event.detail.fieldApiName,
                fieldvalue: event.detail.fieldvalue,
                fieldType: event.detail.fieldType,
                fieldOperator: event.detail.fieldOperator
            };
            updatedFilters.push(filterItem);
        }

        this.selectedFilters = [];
        this.selectedFilters = updatedFilters;

        this.delayedFireFilterChangeEvent();

    }

    delayedFireFilterChangeEvent() {

        console.log('==delayedFireFilterChangeEvent ==filters==', this.selectedFilters);

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {

            const event = new CustomEvent('filterupdate', {
                detail: this.selectedFilters
            });
            this.dispatchEvent(event);

        }, DELAY);
    }
}