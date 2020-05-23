import { LightningElement, api } from 'lwc';

const CSS_CLASS = 'modal-hidden';

export default class ConfirmModal extends LightningElement {
    showModal = false;
    @api textMessage;

    @api
    set header(value) {
        this.hasHeaderString = value !== '';
        this._headerPrivate = value;
    }
    get header() {
        return this._headerPrivate;
    }

    hasHeaderString = false;
    _headerPrivate;

    @api show() {
        this.showModal = true;
    }

    @api hide() {
        this.showModal = false;
    }

    handleDialogClose() {
        //Let parent know that dialog is closed (mainly by that cross button) so it can set proper variables if needed
        const closedialog = new CustomEvent('closedialogaction');
        this.dispatchEvent(closedialog);
        this.hide();
    }

    handleSlotTaglineChange() {
        const taglineEl = this.template.querySelector('p');

        if (taglineEl != null && taglineEl != undefined && taglineEl.classList != null)
            taglineEl.classList.remove(CSS_CLASS);
    }

    handleSlotFooterChange() {
        const footerEl = this.template.querySelector('footer');

        if (footerEl != null && footerEl != undefined && footerEl.classList != null)
            footerEl.classList.remove(CSS_CLASS);
    }
}