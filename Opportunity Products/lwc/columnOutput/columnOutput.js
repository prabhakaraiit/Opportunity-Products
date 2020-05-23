import { LightningElement, api, track } from 'lwc';

export default class ColumnOutput extends LightningElement {

    @api sobjectRecord;
    @api apiName;
    @api fieldType;
    @api wrapText;

    @track fieldValue;

    @track isImage = false;
    @track isText = false;
    @track isNumber = false;
    @track isCheckbox = false;
    @track isDate = false;
    @track isDateTime = false;
    @track isPicklist = false;
    @track isProductName = false;


    renderedCallback() {

        if (!this.apiName.includes('.')) {
            this.fieldValue = this.sobjectRecord[this.apiName];
        }
        else {
            this.fieldValue = this.sobjectRecord[this.apiName.split(".")[0]][this.apiName.split(".")[1]]; //Here we are fetching data from parent field
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

        if (this.apiName == 'Product__r.Name') this.isProductName = true;
    }
}