import { LightningElement, wire, track, api } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

export default class CustomPicklistCmp extends LightningElement {

    @api sobjectApiName;
    @api sobjectFieldApiName;
    @api sobjectFieldApiLabel;

    @track isData;
    @track fieldValue;
    @track defaultRecordTypeId;
    @track picklistoptions;

    @track picklistData;

    @wire(getObjectInfo, { objectApiName: '$sobjectApiName' })
    wiredSobjectDetails({ error, data }) {

        if (data) {
            this.defaultRecordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            this.defaultRecordTypeId = '';
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$defaultRecordTypeId', fieldApiName: '$sobjectFieldApiName' })
    wiredPicklistValues({ error, data }) {

        if (data) {

            this.picklistData = data;
            this.picklistoptions = [{ label: 'None', value: 'None', selected: true }, ...data.values];
            this.isData = true;
            this.fieldValue = 'None';
        }
        else if (error) {

            this.isData = false;
            console.log(error);
        }
    }

    @api
    resetFilters() {

        this.fieldValue = 'None';
    }

    handleChange(event) {

        this.fieldValue = event.target.value;
        var filterItem = { fieldApiName: this.sobjectFieldApiName, fieldvalue: event.target.value, fieldType: 'Picklist' };
        this.dispatchEvent(new CustomEvent('picklistupdate', { detail: filterItem }));
    }
}