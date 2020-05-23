import { LightningElement, api, track } from 'lwc';

export default class HeaderSorting extends LightningElement {

    @api columnApi;
    @api sortBy;
    @api sortDir;

    @track iconName = 'utility:arrowup';
    @track displayIcon = false;

    renderedCallback() {

        this.iconName = (this.sortDir == 'ASC') ? 'utility:arrowup' : 'utility:arrowdown';
        this.displayIcon = (this.columnApi == this.sortBy) ? true : false;
    }

    @api
    reload(sortBy, sortDir) {

        this.sortBy = sortBy;
        this.sortDir = sortDir;

        this.iconName = (this.sortDir == 'ASC') ? 'utility:arrowup' : 'utility:arrowdown';
        this.displayIcon = (this.columnApi == this.sortBy) ? true : false;
    }

    updateSortingJs() {

        const event = new CustomEvent('updatesorting', {
            detail: this.columnApi
        });
        this.dispatchEvent(event);
    }
}