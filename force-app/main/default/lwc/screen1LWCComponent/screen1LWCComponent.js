import { LightningElement, api, wire, track } from 'lwc';
import {refreshApex} from '@salesforce/apex';
import { loadStyle } from "lightning/platformResourceLoader";
import modal from "@salesforce/resourceUrl/CustomModel";
import { CloseActionScreenEvent } from "lightning/actions";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import demo from './demo.html';
import InsertProperty from '@salesforce/apex/SaveProperty.InsertProperty';
import getPriceBook from '@salesforce/apex/SaveProperty.getPriceBook';
import GetAllProducts from '@salesforce/apex/SaveProperty.GetAllProducts';
import insertProduct from '@salesforce/apex/SaveProperty.insertProduct';
import getPricebookfromOpp from '@salesforce/apex/SaveProperty.getPricebookfromOpp';

const columns = [
    {
        label: 'Name',
        fieldName: 'Name',
        type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
        // }, {
        //     label: 'Product Code',
        //     fieldName: 'ProductCode',
        //     type: 'text',
    },
];


export default class Screen1LWCComponent extends NavigationMixin(LightningElement) {

    @api recordId;
    @track OppId;
    @track propertyid;
    @track name;
    @track fieldVisible1 = false;
    @track fieldVisible2 = false;
    @track saveProperty=true;
    @track saveProduct = false;
    @track input;
    @track inputvalue;
    @track isLoading = false;
    @track selectPricebookdisabled = true;
        //data = [];
    @track properties = [];
    @track diffPropIDs = [];
    @track priceOptions;
    @track  pricebookId;
    @track sameProductVisibility = false;
    @track columns = columns;
    @track productList = [];
    @track  selectedProdlist= [];
    @track  samePropid;
    @track propertyList;
    priceBookData;
    @track radioGroupForProductDisabled = true;
    @track PropertyNameToSaveProduct = [];
    wireData;


    connectedCallback(){
        loadStyle(this, modal);
    }


    handleOnload(){
        this.OppId = this.recordId;
    }

    get pricebookoptions() {
        return this.priceOptions;
    }

    get isPricebookIdpresent(){
        return this.selectPricebookdisabled;
    }
    
    // for radio Yes or No
    get options() {
        return [
            { label: 'Yes', value: 'option1' },
            { label: 'No', value: 'option2' },
        ];
    }

    get components() {
        let components = [];
        for (let i = 0; i < this.inputvalue; i++) {
            components.push(demo);
        }
        return components;
    }

    //get all products
    @wire(getPricebookfromOpp, { oppId: '$recordId'})
        
    wireGetPriceBooklist({ data, error }) {
        this.wireData=data;
    if (data) {
        let arrlist=[];
        arrlist.push({label: this.wireData.Name, value: this.wireData.Id})
        this.priceOptions = arrlist;
        this.pricebookId = this.wireData.Id;
        if(this.pricebookId != undefined){
           this.selectPricebookdisabled=true;
        }
       
    } else {
        getPriceBook()
            .then(results3 => {
                if(this.pricebookId == undefined){
                    this.selectPricebookdisabled=false;
                }
                let arr = []
                for (var i = 0; i < results3.length; i++) {
                    arr.push({ label: results3[i].Name, value: results3[i].Id })
                }
                this.priceOptions = arr;
            })
    }
    }

    //for first radio button
    handleChoice(event) {
        const selectedOption = event.detail.value;
        this.saveProperty = true;
        if (selectedOption == 'option1') {
            this.fieldVisible1 = true;
            this.fieldVisible2 = false;
            
        }
        else {
            this.fieldVisible1 = false;
            this.fieldVisible2 = true;
        }
    }
    handleQuantity(event) {

        this.inputvalue = event.target.value;
    }

    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
      }


    saveMultiple () {
        this.isLoading = true; 
        let isVal = true;
        this.template.querySelectorAll('lightning-input-field').forEach(element => {
            isVal = isVal &&   element.reportValidity();
        });
        if (isVal) {
            this.template.querySelectorAll('lightning-record-edit-form').forEach(element => {
                element.submit();
            });
            this.saveProperty=false;
            this.saveProduct = true;
            this.radioGroupForProductDisabled = false;
        }
    }

    save () {
        this.isLoading = true; 
        let isVal = true;
        this.template.querySelectorAll('lightning-input-field').forEach(element => {
            isVal = isVal &&   element.reportValidity();
        });
        if (isVal) {
            this.template.querySelectorAll('lightning-record-edit-form').forEach(element => {
                element.submit();
            });
            
        }
        this.saveProperty=false;
        this.saveProduct = true;
        this.radioGroupForProductDisabled = false;
    }

    handleSuccessSameDetails (event) {
        this.propertyid= event.detail.id;
        if(this.propertyid !== undefined){
                InsertProperty({
                    propertyid : this.propertyid,
                    quantity : this.inputvalue
                })
                .then(result => {
                    let arrForProp=[];
                    arrForProp.push({label: result.Name, value: result.Id})
                    console.log('results of same prop --->'+result)
                    this.samePropid= result;
                    this.isLoading = false; 
                    this.PropertyNameToSaveProduct = result.Name;
                    console.log('property Name =='+result.Name )

                    const toastEvent = new ShowToastEvent({
                    title: 'Success!',
                    message: 'Property Record Inserted successfully',
                    variant: 'success'
                });
        
                this.dispatchEvent(toastEvent);
                })
                .catch(error => {
                    this.errorMsg = error.message;

                    this.isLoading = false; 
                    const toastEvent = new ShowToastEvent({
                    title: 'Error!',
                    message: this.errorMsg,
                    variant: 'error'
                });
        
                this.dispatchEvent(toastEvent);
                this.saveProduct = true;
                this.saveProperty =false;
            })
        }else{
            this.isLoading = false; 
                    const toastEvent = new ShowToastEvent({
                    title: 'Error!',
                    message: 'There was an error while inserting Property',
                    variant: 'error'
                });
        
                this.dispatchEvent(toastEvent);
        }
    }

    handleSuccessDiffDetails(event){
        const PropIDs = event.detail.id;
        this.diffPropIDs.push(PropIDs);
        this.saveProperty=false;
        this.saveProduct = true;
        this.isLoading = false; 
        const toastEvent = new ShowToastEvent({
            title: 'Success!',
            message: 'Property Record Inserted successfully',
            variant: 'success'
        });

        this.dispatchEvent(toastEvent);
    }

    handlePricebookchoice(event) {
        this.pricebookId = event.target.value;
      }

      // for second radio button
      handleProdChoice(event) {
        const selectedOption = event.detail.value;
        GetAllProducts({    PriceBookId: this.pricebookId  })
            .then(result2 => {
                    this.productList = result2;
                    this.error = undefined;  
            })

            .catch(error => {
                this.error = error;
                    this.productList = undefined;
            });      
        if (selectedOption == 'option1') {
            this.sameProductVisibility = true;
            this.saveProduct = true;
        }
        else {
            this.sameProductVisibility = false;
            this.saveProduct = true;
        }
    }

    getSelectedProdRec() {
        var selectedRecords = this.template.querySelector("lightning-datatable").getSelectedRows();
        if (selectedRecords.length > 0) {
          let ids = '';
          let Name = '';
          selectedRecords.forEach(currentItem => {
            ids = ids + ',' + currentItem.Id;
            Name = Name + ',' + currentItem.Name;
          });
          this.lstSelectedRecords = selectedRecords;
          this.NrProducts = selectedRecords.length;
          //alert(this.selectedIds);
          let selectedIdsArray = [];
          for (const element of selectedRecords) {
            //console.log('elementid', element.Id);
            selectedIdsArray.push(element.Id);
          }
          this.selectedProdlist = selectedIdsArray;
        }
    
      }

    saveSameProd(){
        if(this.fieldVisible1 === true){
            this.propertyList = this.samePropid;
        }else if(this.fieldVisible2 === true){
            this.propertyList = this.diffPropIDs;
        }


        insertProduct({
            priceBookId: this.pricebookId, 
            productlist: JSON.stringify(this.selectedProdlist), 
            propertyList: JSON.stringify(this.propertyList),
            oppId: this.OppId
        })
        .then(result =>{
            refreshApex(this.wireData);
            console.log('Result --->'+JSON.stringify(result));
        })
        .catch(error=>{
            console.log('Result --->'+JSON.stringify(error));
        })
    }

}