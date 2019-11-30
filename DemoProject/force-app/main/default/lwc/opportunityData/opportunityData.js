/* eslint-disable radix */
/* eslint-disable no-alert */
import { LightningElement, track,api } from 'lwc';
import getOpportunitesData from '@salesforce/apex/OpportunityDataCompController.getOpportunitesData';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOppportunitidBasedOnKey from '@salesforce/apex/OpportunityDataCompController.getOppportunitidBasedOnKey';
import { NavigationMixin } from 'lightning/navigation';
/*import dataTableStyles from '@salesforce/resourceUrl/datatableStyles';
import { loadStyle } from 'lightning/platformResourceLoader';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import OPPORTUNITYNAME from '@salesforce/schema/Opportunity.Name';
import OPPORTUNITYACCOUNT from '@salesforce/schema/Opportunity.AccountId';
import OPPORTUNITYAMOUNT from '@salesforce/schema/Opportunity.Amount';
import OPPORTUNITYCLOSEDDATE from '@salesforce/schema/Opportunity.CloseDate';
import OPPORTUNITYSTAGE from '@salesforce/schema/Opportunity.StageName';*/
//const OPPORTUNITYFIELDS = [OPPORTUNITYSTAGE,OPPORTUNITYNAME, OPPORTUNITYACCOUNT, OPPORTUNITYAMOUNT, OPPORTUNITYCLOSEDDATE];
//const OPPORTUNITYFIELDS = ['Name', 'AccountId', 'Amount', 'CloseDate','StageName'];
const columns = [
    {
        label: 'Opportunity Name', fieldName: 'Name', type: 'text', sortable: true, editable: true,
        typeAttributes: {
            required: true,
            title: { fieldName: 'Name' }
        }, cellAttributes: {
            alignment: 'left'
        },
        tooltip: {
            fieldName: 'Name'
        }
    },
    {
        label: 'Account', fieldName: 'AccountName__c', sortable: true, type: 'text', editable: false, typeAttributes: { required: true, title: { fieldName: 'AccountName__c' } }, cellAttributes: {
            alignment: 'center'
        }
    },
    {
        label: 'Stage', fieldName: 'StageName', sortable: true, type: 'text', editable: false, typeAttributes: { required: true, title: { fieldName: 'StageName' } }, cellAttributes: {
            alignment: 'left'
        }
    },
    {
        label: 'Closed Date', fieldName: 'CloseDate', sortable: true, type: 'date', editable: true,
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: 'true',
            title: { fieldName: 'CloseDate' }
        },
        cellAttributes: {
            alignment: 'left'
        }
    },
    {
        label: 'Amount', fieldName: 'Amount', sortable: true, type: 'currency', editable: true,
        typeAttributes: {
            currencyCode: 'USD',
            title: { fieldName: 'Amount' }
        }, cellAttributes: {
            alignment: 'center'
        }
    },
    {
        label: 'Action', type: 'button', initialWidth: 80,
        typeAttributes: {
            label: 'Edit',
            name: 'edit_Opportunity',
            title: 'Edit Opportunity'
        }
    }    
];

export default class OpportunityData extends NavigationMixin(LightningElement){
    @track showLoading = false;
    @track searchInput;
    @track prevButtonDisabled = true;
    @track nextButtonDisabled = true;
    @track columns = columns;
    @track opportunityData;
    @track showPagination = true;
    @track draftValues;
    @track sortedBy;
    @track sortedDirection = 'asc';
    @track onLoadData;
    @api resultsPerPage;
    @track cachedResults;
    @track currentOffSetSize = 0;
    @track rowNumberOffset = 50;
    @track showRowNumberColumn = false;
   // @track opportunityAPIName = OPPORTUNITY_OBJECT;
    //@track oppFields = OPPORTUNITYFIELDS;
    @track resultMaxNumber = 25;
    changeHandler(event) {
        this.searchInput = event.target.value;
        if (this.searchInput === '' || this.searchInput.trim() === '' || !this.searchInput) {
            this.opportunityData = this.onLoadData;
        }
    }
    connectedCallback() {
      /*  Promise.all([
            loadStyle(this, dataTableStyles),
        ]).then(() => {

        });*/
        this.retrieveOpportunitiesData();
    }
    retrieveOpportunitiesData() {
        getOpportunitesData()
            .then(result => {
                this.showLoading = false;
                this.opportunityData = result;
                this.onLoadData = result;
                this.cachedResults = result;
                this.resultMaxNumber = result.length;
                this.handleInitialPagination();
            })
            .catch(error => {
                window.console.log('An Error Occured While retreiving Data' + JSON.stringify(error));
            });
    }

    displayPreviousResults() {
        if (this.currentOffSetSize - this.resultsPerPage < this.resultsPerPage) {
            this.rowNumberOffset = 0;
            this.opportunityData = this.extractResultsBasedOnSize(this.cachedResults, this.resultsPerPage, 0);
            this.currentOffSetSize = this.opportunityData.length ;
            this.disableButtonByName('prev');
        } else {
            this.rowNumberOffset = this.currentOffSetSize - this.resultsPerPage
            this.opportunityData = this.this.extractResultsBasedOnSize(this.cachedResults, this.resultsPerPage, this.currentOffSetSize - this.resultsPerPage);
            this.currentOffSetSize = this.currentOffSetSize - this.resultsPerPage;
        }
    }
    displayNextResults() {
        this.opportunityData = this.extractResultsBasedOnSize(this.cachedResults, this.resultsPerPage, this.currentOffSetSize + 1);
        this.rowNumberOffset = this.currentOffSetSize + 1;
        this.currentOffSetSize = this.currentOffSetSize + this.opportunityData.length;
        this.nextButtonDisabled = this.cachedResults.length > this.currentOffSetSize ? false : true;
        this.enableButtonByName('prev');
    }
    handleInitialPagination() {
        this.resultsPerPage = this.resultsPerPage ? this.resultsPerPage : 25;
        let totalPagesCount = 1;
        totalPagesCount = this.opportunityData && this.opportunityData.length > this.resultsPerPage ? this.opportunityData.length / this.resultsPerPage : 1;
        if (totalPagesCount <=1) {
            this.disableButtonByName('prev');
            this.disableButtonByName('next');
            this.opportunityData = this.cachedResults;
            this.currentOffSetSize = this.opportunityData.length;
        }
        else {
            this.enableButtonByName('next');
            this.opportunityData = this.extractResultsBasedOnSize(this.cachedResults, this.resultsPerPage, 0);
            this.currentOffSetSize = this.resultsPerPage;
         }
    }
    disableButtonByName(btnName) {
        if (btnName==='prev') {
             this.prevButtonDisabled = true;
        } else if (btnName === 'next') {
            this.nextButtonDisabled = true;
        }
    }
    enableButtonByName(btnName) {
        if (btnName === 'prev') {
            this.prevButtonDisabled = false;
        } else if (btnName === 'next') {
            this.nextButtonDisabled = false;
        }
    }
    extractResultsBasedOnSize(results, size,offset) {
        let resultsToReturn=[];
        if (results && size && results[offset]) {
            for (let i = 0; i < size; i++){
                if (results[offset+i]) {
                    resultsToReturn.push(results[offset + i]);
                }
                else break;
            }
            window.console.log(JSON.stringify(resultsToReturn));
            return resultsToReturn;
        }
        return results;
    }

    handleRecordSave(event) {
        const recordInputs = event.detail.draftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        const promises = recordInputs.map(recordInput => updateRecord(recordInput));

        Promise.all(promises).then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Opportunities Updated Succesfully',
                    variant: 'success'
                })
            );
            this.draftValues = [];
            //this.opportunityData = null;
            this.retrieveOpportunitiesData();
        }).catch(error => {
            window.console.log('error' + JSON.stringify(error));
        });
    }


    sortColumns(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortData(this.sortedBy, this.sortedDirection);
    }

    sortData(fieldName, sortDirection) {
        var data = JSON.parse(JSON.stringify(this.opportunityData));
        //function to return the value stored in the field
        var key = (a) => a[fieldName];
        var reverse = sortDirection === 'asc' ? 1 : -1;
        data.sort((a, b) => {
            let valueA, valueB;
            if (fieldName === 'Amount') {
                valueA = key(a) ? key(a) : '';
                valueB = key(b) ? key(b) : '';
            }
            else {
                valueA = key(a) ? key(a).toLowerCase() : '';
                valueB = key(b) ? key(b).toLowerCase() : '';
            }
            return reverse * ((valueA > valueB) - (valueB > valueA));
        });

        //set sorted data to opportunities attribute
        this.opportunityData = data;
    }
    handleKeyUp(event) {
        if (event && event.keyCode === 13) {
            this.showLoading = true;
            this.searchDataBase();
        }
        if (!this.searchInput || this.searchInput === '' || this.searchInput === ' ') {
            this.opportunityData = this.onLoadData;
            this.cachedResults = this.onLoadData;
            this.handleInitialPagination();
        }
    }
    searchDataBase() {
        getOppportunitidBasedOnKey({ searchKey: this.searchInput })
            .then(result => {
                this.showLoading = false;
                this.opportunityData = result;
                this.cachedResults = result;
                this.handleInitialPagination();
            }).catch(error => {
                this.showLoading = false;
                this.opportunityData = undefined;
                window.console.log('error' + JSON.stringify(error))
            });
    }
    createNewOpportunity() {
        this[NavigationMixin.Navigate]({
            type: "standard__objectPage",
            attributes: {
                objectApiName:'Opportunity',
                actionName: "new"
            },
        });
    }
    handleOppCreated() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Opportunity Created Succesfully',
                variant: 'success'
            }));

            
    }
    handleRowAction(event) {
        //const action = event.detail.action;
        const rowData = event.detail.row;
        this.navigateToOpportunityEditPage(rowData.Id);
    }
    navigateToOpportunityEditPage(recordId) {
        if (recordId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__objectPage',
                attributes: {
                    recordId: recordId,
                    objectApiName: 'Opportunity',
                    actionName: 'edit'
                }
            });
        }
    }
    refreshData() {
        this.retrieveOpportunitiesData();
    }

}