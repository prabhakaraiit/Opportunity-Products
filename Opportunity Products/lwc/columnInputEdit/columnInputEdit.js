import { LightningElement, api, track } from 'lwc';

export default class ColumnInputEdit extends LightningElement {

    @api showModal = false;
    @api fieldValue;
    @api fieldType;
    @api apiName;
    @api discountType;
    @api listPrice;
    @api picklistData = [];

    @track privateFieldVal;
    @track isText = false;
    @track isNumber = false;
    @track isCheckbox = false;
    @track isDate = false;
    @track isDateTime = false;
    @track isAdvanceCal = false;
    @track isPicklist = false;

    @track isusd = false;

    @track advanceCalVal = 'usd';

    closepopup = true;

    handleFocusout() {

        this.closepopup = true;
    }

    handleFocus() {
        this.closepopup = false;
    }

    @api
    closeModal() {

        if (this.closepopup) {

            this.showModal = false;

            if (this.isAdvanceCal) {

                let advanceDis = { fieldVal: this.fieldValue, discType: this.advanceCalVal };
                this.dispatchEvent(new CustomEvent('advancediscountupdate', { detail: advanceDis }));
            }
        }
        else {

            this.closepopup = true;
        }
    }

    delayedCloseModel() {

        window.clearTimeout(this.delayTimeout);
        this.delayTimeout = setTimeout(() => {

            this.closeModal();
        }, 200);
    }

    @api
    openModal(fieldValue, fieldType, apiName, discountType, listPrice, picklistData) {

        this.closepopup = false;
        this.fieldValue = fieldValue;
        this.fieldType = fieldType;
        this.apiName = apiName;
        this.discountType = discountType;
        this.listPrice = listPrice;

        let pickOptions = [];

        let dataOptions = { strLabel: 'None', strValue: 'none' };
        pickOptions.push(dataOptions);

        picklistData.forEach(options => {

            let dataOptions = { strLabel: options.strLabel, strValue: options.strValue };
            pickOptions.push(dataOptions);

        });

        this.picklistData = pickOptions;

        if (this.fieldType == 'Text') this.isText = true;
        else if (this.fieldType == 'Number') this.isNumber = true;
        else if (this.fieldType == 'Checkbox') this.isCheckbox = true;
        else if (this.fieldType == 'Date') this.isDate = true;
        else if (this.fieldType == 'Date Time') this.isDateTime = true;
        else if (this.fieldType == 'Picklist') this.isPicklist = true;

        this.showModal = true;

        window.clearTimeout(this.delayTimeout1);
        this.delayTimeout1 = setTimeout(() => {

            let ltngInput = this.template.querySelector('lightning-input');

            if (ltngInput != undefined)
                ltngInput.focus();
            else {

                let selectInput = this.template.querySelector('select');

                if (selectInput != undefined)
                    selectInput.focus();
            }
        }, 300);


    }

    handlePicklistUpdate() {

        let ltngSelect = this.template.querySelectorAll('select');
        let selectedVal = ltngSelect[0].value;

        if (selectedVal == 'none')
            this.fieldValue = '';
        else
            this.fieldValue = selectedVal;

        this.dispatchEvent(new CustomEvent('columnupdate', { detail: this.fieldValue }));
    }

    handleUpdate(event) {

        let updatedVal = event.detail.value;
        this.fieldValue = updatedVal;

        if (!this.isAdvanceCal) {

            this.dispatchEvent(new CustomEvent('columnupdate', { detail: updatedVal }));
        }

    }

    handleAdvanceCal() {

        let ltngSelect = this.template.querySelectorAll('select');
        let selectedVal = ltngSelect[0].value;

        if (selectedVal == 'usd') {

            let calcFieldVal = (this.fieldValue / 100) * this.listPrice;

            this.fieldValue = calcFieldVal;
            this.advanceCalVal = 'usd';
        }
        else {

            let calcFieldVal = (this.fieldValue / this.listPrice) * 100;
            this.fieldValue = calcFieldVal;
            this.advanceCalVal = 'per';

        }
    }
}