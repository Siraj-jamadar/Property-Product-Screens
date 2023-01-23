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
import saveDiffProducts from '@salesforce/apex/SaveProperty.saveDiffProducts'; 
import getPropertyDetials from '@salesforce/apex/SaveProperty.getPropertyDetials';
import getPricebookfromOpp from '@salesforce/apex/SaveProperty.getPricebookfromOpp';

import TickerSymbol from '@salesforce/schema/Account.TickerSymbol';

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
    @track pricebookId;
    @track sameProductVisibility = false;
    @track saveDiffProductVisibility = false;
    @track productSaveDisabled = false;
    @track columns = columns;
    @track productList = [];
    @track selectedProdlist= [];
    @track samePropid;
    @track samePropidMap = [];
    @track diffPropidMap = [];
    @track propertyList;
    priceBookData;
    @track radioGroupForProductDisabled = true;
    @track saveDiffProdForProperty = false;
    @track PropertyNameToSaveProduct = [];
    wireData;
    @track currentSaveValue = 1;
    @track saveProdButtonLabel = '';
    @track diffPropertyId;
    @track showPropName;


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
                    for (var i = 0; i < result.length; i++) {
                        arrForProp.push({ value: result[i].Id, label: result[i].Name })
                    }
                    this.samePropidMap = arrForProp

                    let arrOfPropId = [];
                    for (var i = 0; i < result.length; i++) {
                        arrOfPropId.push(result[i].Id );
                    }
                    this.samePropid= arrOfPropId;
                    this.isLoading = false; 
                    console.log('samePropid =='+JSON.stringify(this.samePropid) );

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
        console.log('Id---->'+this.diffPropIDs);
        getPropertyDetials({
            propertyList:JSON.stringify(this.diffPropIDs)
        })
        .then(result => {
            console.log('Enetered here')
            let arrForProp=[];
            for (var i = 0; i < result.length; i++) {
                arrForProp.push({ value: result[i].Id, label: result[i].Name })
            }
            this.diffPropidMap = arrForProp;
            console.log('Array-->'+JSON.stringify(this.diffPropidMap));
        })
        .catch(error => {
            console.log('Error retrieving data. '+error);
        })
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
            this.saveDiffProdForProperty = false;
        }
        else {
            this.sameProductVisibility = false;
            this.saveProduct = false;
            this.saveDiffProdForProperty=true;
            this.saveDiffProductVisibility=true;
            this.saveProdButtonLabel = 'Save product and Next';
            console.log('Button label --- >'+this.saveProdButtonLabel);
            if(this.fieldVisible1 == true){
                this.diffPropertyId = this.samePropid[0];
                const keys = Object.keys(this.samePropidMap);
                const key = keys.find(k => this.samePropidMap[k] === this.diffPropertyId);
             if(key){
                this.showPropName = this.samePropidMap[key]; 
                }
            }else if(this.fieldVisible2 === true){
                this.diffPropertyId = this.diffPropIDs[0];
                console.log('First Property Id --- >'+this.diffPropertyId);
                const keys = Object.keys(this.diffPropidMap);
                const key = keys.find(k => this.diffPropidMap[k] === this.diffPropertyId);
             if(key){
                this.showPropName = this.diffPropidMap[key]; 
                }
            }
            
            
           // this.showPropName = Object.entries(this.samePropidMap).find(([, v]) => v === this.diffPropertyId)[0];
            console.log('Property Name--->'+this.showPropName);
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
          let selectedIdsArray = [];
          for (const element of selectedRecords) {
            //console.log('elementid', element.Id);
            selectedIdsArray.push(element.Id);
          }
          this.selectedProdlist = selectedIdsArray;
          console.log('Selected Pro id--->'+this.selectedProdlist);
        }
    
      }

    //   getDiffSelectedProdRec() {
    //     const propIdVsProdIdmap = new Map();
    //     this.template.querySelector("lightning-datatable").forEach(element => {
    //         let selectedRecords = element.getSelectedRows();  
    //         console.log('Entered here');
    //         console.log('Selected row --->'+selectedRecords);
    //         if (selectedRecords.length > 0) {
    //             let ids = '';
    //             let Name = '';
    //             selectedRecords.forEach(currentItem => {
    //               ids = ids + ',' + currentItem.Id;
    //               Name = Name + ',' + currentItem.Name;
    //             });
    //             let selectedIdsArray = [];
    //             for (const element of selectedRecords) {
    //               //console.log('elementid', element.Id);
    //               selectedIdsArray.push(element.Id);
    //             }
    //             for(let i=0; i<this.samePropid.length; i++){
    //                 propIdVsProdIdmap.set(this.samePropid[i],selectedIdsArray)
    //             }
    //         }
    //         console.log('Map values--->'+JSON.stringify(propIdVsProdIdmap));
            
    //     });
        
    //       this.selectedProdlist = selectedIdsArray;
    //       console.log('Selected Pro id--->'+this.selectedProdlist);
    
    //   }

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
            const toastEvent = new ShowToastEvent({
                title: 'Success!',
                message: 'Product Record Inserted successfully',
                variant: 'success'
            });
    
            this.dispatchEvent(toastEvent);
            this.closeAction();
        })
        .catch(error=>{
            console.log('Result --->'+JSON.stringify(error));
        })
    }

    saveDiffPropVsProd(){
        
            saveDiffProducts({
                priceBookId: this.pricebookId, 
                productlist: JSON.stringify(this.selectedProdlist), 
                propertyList:JSON.stringify(this.diffPropertyId),
                oppId: this.OppId
            })
            .then(results =>{
                console.log('Result --->'+JSON.stringify(results));
                if(this.fieldVisible1 == true){
                    this.diffPropertyId = this.samePropid[this.currentSaveValue];
                }else if(this.fieldVisible2 === true){
                    this.diffPropertyId = this.diffPropIDs[this.currentSaveValue];
                }
                //this.showPropName =  Object.entries(this.samePropidMap).find(([, v]) => v === this.diffPropertyId)[0];
                if(this.currentSaveValue <= this.inputvalue){
                    this.currentSaveValue += 1;
                }
                console.log('current counter value---->'+this.currentSaveValue)
                if(this.currentSaveValue == this.inputvalue){
                    this.saveProdButtonLabel = 'Save Product and Finish';
                }else if(this.currentSaveValue > this.inputvalue){
                    this.productSaveDisabled = true;
                    const toastEvent = new ShowToastEvent({
                        title: 'Success!',
                        message: 'Product Record Inserted successfully',
                        variant: 'success'
                    });
            
                    this.dispatchEvent(toastEvent);
                    this.closeAction();
                }   
            })
            .catch(error=>{
                console.log('Result --->'+JSON.stringify(error));
            })
         
    }
}