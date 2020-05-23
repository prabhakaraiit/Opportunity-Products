import { LightningElement, track, api } from 'lwc';
import getPicklistValues from '@salesforce/apex/ProductListCtrl.getPicklistOptions';

export default class ColumnInput extends LightningElement {

    sobjUpdatedFieldVal;

    @track gridcls = 'slds-grid';
    @track fieldValue;
    @api sobjectRecord;
    @api apiName;
    @api fieldType;

    @track btnIconclass = 'slds-m-left_xx-small, slds-hide';

    @track discountType;

    @track isImage = false;
    @track isText = false;
    @track isNumber = false;
    @track isCheckbox = false;
    @track isDate = false;
    @track isDateTime = false;
    @track isPicklist = false;
    @track listPrice;

    @track isLocked = false;

    @track picklistData = [];

    connectedCallback() {

        if (!this.apiName.includes('.')) {
            this.fieldValue = this.sobjectRecord[this.apiName];
        }
        else {
            this.fieldValue = this.sobjectRecord[this.apiName.split(".")[0]][this.apiName.split(".")[1]];
        }

        if (this.fieldType == 'Image') {

            this.isImage = true;

            const container = this.template.querySelector('.imagecontainer');
            container.innerHTML = this.fieldValue;
        }
        else if (this.fieldType == 'Text') this.isText = true;
        else if (this.fieldType == 'Number') this.isNumber = true;
        else if (this.fieldType == 'Checkbox') this.isCheckbox = true;
        else if (this.fieldType == 'Date') this.isDate = true;
        else if (this.fieldType == 'Date Time') this.isDateTime = true;
        else if (this.fieldType == 'Picklist') this.isPicklist = true;

        if (this.isPicklist) {

            getPicklistValues({ fieldApiName: this.apiName })
            .then(result => {

                let pickOptions = [];
                result.forEach(options => {
                    let dataOptions = { strLabel: options.strLabel, strValue: options.strValue };
                    pickOptions.push(dataOptions);

                });

                this.picklistData = pickOptions;
            })
            .catch(error => {
                console.log('====the error in picklist options ==', error);
            });
        }
    }

    handleEditAction() {

        this.template.querySelector('c-column-input-edit').openModal(this.fieldValue, this.fieldType, this.apiName, this.discountType, this.listPrice, this.picklistData);
    }

    handleEdit() {

        this.btnIconclass = 'slds-m-left_xx-small, slds-show';
    }

    diableEdit() {

        this.btnIconclass = 'slds-m-left_xx-small, slds-hide';
    }

    handleCloseModel() {

        this.template.querySelector('c-column-input-edit').closeModal();
    }

    handleUpdate(event) {

        let editVal = event.detail;

        this.privateFieldVal = editVal;
        this.fieldValue = editVal;

        this.gridcls = 'slds-grid slds-is-edited';

        let updatedVal = { lineId: this.sobjectRecord.Id, fieldName: this.apiName, fieldVal: editVal };

        this.sobjUpdatedFieldVal = updatedVal;

        this.delayedFireFilterChangeEvent();
    }

    handleDiscountUpdate(event) {

        let editVal = event.detail.fieldVal;
        let discType = event.detail.discType;

        this.privateFieldVal = editVal;
        this.fieldValue = editVal;

        this.gridcls = 'slds-grid slds-is-edited';

        if (discType == 'usd')
            this.discountType = '$';
        else
            this.discountType = '%';

        let updatedVal = { lineId: this.sobjectRecord.Id, fieldName: this.apiName, fieldVal: editVal, discType: discType };

        this.dispatchEvent(new CustomEvent('discounttypeupdate', { detail: updatedVal }));
    }

    delayedFireFilterChangeEvent() {

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {

            this.dispatchEvent(new CustomEvent('columnupdate', { detail: this.sobjUpdatedFieldVal }));
        }, 200);
    }
}