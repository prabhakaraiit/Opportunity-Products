import { LightningElement, track, api, wire } from 'lwc';
import getOppDetails from "@salesforce/apex/OppProductController.getOpportunityDetails";

export default class OppProductsEditor extends LightningElement {

    @api recordId;

    @track error;
    @track pricebook2Id;
    @track recordTypeName;

    @wire(getOppDetails, { oppId: '$recordId'})
    queryOpportunityDetails ({error, data}) {
        if (error) {
            
            this.error = 'Unknown error';
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                this.error = error.body.message;
            }
            this.recordTypeName = undefined;
            this.pricebook2Id = undefined;

        } else if (data) {
            
            this.error = undefined;
            this.recordTypeName = 'test';
            //this.recordTypeName = data.RecordType.DeveloperName;
            
            if (data.Pricebook2Id == null || data.Pricebook2Id == undefined) {
                this.error = 'The Pricebook Id is not found.';
            }
            else {

                this.pricebook2Id = data.Pricebook2Id;
            }
        }
    }

    handleOppLineItemsUpdate(event){

        console.log('====handleOppLineItemsUpdate===', event);
        this.template.querySelector('c-opp-product-list').refreshOppLines();
    }

    handleCloseJs(event){

        console.log('====handleCloseJs===', event);
        const closeQA = new CustomEvent('close');
        this.dispatchEvent(closeQA);

    }
}