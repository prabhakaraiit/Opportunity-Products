import { LightningElement, api, track } from 'lwc';

export default class ProductFilterItem extends LightningElement {

    @api fieldType;
    @api fieldApiName;
    @api fieldLabel;
    @api fieldOperator;

    @track fieldValue;

    get isText() {
        return this.fieldType == 'Text';
    }

    get isDate() {
        return this.fieldType == 'Date';
    }

    get isPicklist() {
        return this.fieldType == 'Picklist';
    }

    get isNumber() {
        return this.fieldType == 'Number';
    }

    get isDateTime() {
        return this.fieldType == 'Date Time';
    }

    handleKeyChange(event) {

        console.log('====event===', event.target.value);

        this.fieldValue = event.target.value;

        var filterItem = {
            fieldApiName: this.fieldApiName,
            fieldvalue: event.target.value,
            fieldType: this.fieldType,
            fieldOperator: this.fieldOperator
        };

        console.log('=====filterItem===handleKeyChange ===', filterItem);
        this.dispatchEvent(new CustomEvent('filterupdate', { detail: filterItem }));
    }

    handlePicklistUpdate(event) {

        console.log('====event=fieldvalue==', event.detail.fieldvalue);

        var filterItem = {
            fieldApiName: event.detail.fieldApiName,
            fieldvalue: event.detail.fieldvalue,
            fieldType: event.detail.fieldType,
            fieldOperator: this.fieldOperator
        };

        console.log('=====filterItem===picklistahndler ===', filterItem);
        this.dispatchEvent(new CustomEvent('filterupdate', { detail: filterItem }));

    }

    @api
    resetFilters() {


        this.fieldValue = undefined;

        if (this.fieldType == 'Picklist') {
            this.template.querySelector('c-custom-picklist-cmp').resetFilters();
        }
    }
}