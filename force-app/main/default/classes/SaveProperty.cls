public class SaveProperty {
    @AuraEnabled
	public static List<id> InsertProperty(string propertyid , integer quantity){
        List<Property__c> propertylist = new List<Property__c>();
        List<id> PropertyIds=new List<id>();
        try{
            Property__c propertyrec = [select id,Name,Opportunity__c,Client_Tax_Filing_Deadline__c,Client_Request_Date__c,Type__c,
            Primary_Building_Function__c,Owning_Entity__c,Operating_Entity__c from Property__c where id =:propertyid];

            for (integer i=2; i<=quantity; i++ ){
                Property__c proprec = new Property__c();
                proprec.Name = propertyrec.Name+'_000'+i;
                proprec.Opportunity__c  =propertyrec.Opportunity__c;
                proprec.Type__c = propertyrec.Type__c;
                proprec.Primary_Building_Function__c	= propertyrec.Primary_Building_Function__c;
                proprec.Client_Tax_Filing_Deadline__c = propertyrec.Client_Tax_Filing_Deadline__c;
                proprec.Client_Request_Date__c = propertyrec.Client_Request_Date__c;
                proprec.Owning_Entity__c =  propertyrec.Owning_Entity__c;
                proprec.Operating_Entity__c = propertyrec.Operating_Entity__c;
                propertylist.add(proprec);
            }

            propertyrec.Name = propertyrec.Name + '_0001';
            propertylist.add(propertyrec);

            upsert propertylist;
            for(Property__c pr :propertylist){
                PropertyIds.add(pr.id);
            }  

        }
        catch(exception e){
            System.debug('Exception-------------'+JSON.serialize(e));  
        }
       

        return PropertyIds;
      		                                         
                                                  
    }

    @AuraEnabled(cacheable=true)
    public static list<Pricebook2> getPriceBook() {

            list<Pricebook2> pricebookList = [Select Id,Name from Pricebook2];
            system.System.debug('pricebookList=='+pricebookList);
            return pricebookList;
        

    }

    @AuraEnabled(cacheable=true)
    public static Pricebook2 getPricebookfromOpp(String oppId) {
        System.debug('opportunity Id --->>>'+oppId);
        Opportunity oppRec = [Select id,PriceBook2Id from Opportunity where Id=:oppId limit 1];
        if(oppRec.PriceBook2Id!=null){
            Pricebook2 pricebook = [Select Id,Name from Pricebook2 where id=:oppRec.PriceBook2Id];
            return pricebook;
        }else {
            return null;
        }
    }


    @AuraEnabled(cacheable=true)
    public static List<Product2> GetAllProducts(String PriceBookId ){
        try {
            List<Product2> ProdList = [select id,Name
                                       from Product2 where id IN (Select Product2Id 
                                                                  from PricebookEntry 
                                                                  where Pricebook2Id  =:PriceBookId)];
            return ProdList;
           
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static void SaveProduct(){
        
    }


    @AuraEnabled
	public static List<Id> insertProduct(String priceBookId,String productlist,String propertyList,String oppId){
		Map<ID,PricebookEntry> productPricebookMap = new Map<ID,PricebookEntry>();
		List<OpportunityLineItem> oli = new List<OpportunityLineItem>();
        List<Id> oliIdList = new List<Id>();
        productlist = productlist.replace('[','').replace(']',''); 
        productlist = productlist.replace('\"',''); 
        List<String> ProdList = productlist.split(',');    

        propertyList = propertyList.replace('[','').replace(']',''); //Taking out ( and )
        propertyList = propertyList.replace('\"',''); //Taking out '
        List<String> propList = propertyList.split(',');    
        
        Opportunity oppRec = [Select Id,Pricebook2Id from Opportunity where Id=:oppId];
        if(oppRec.Pricebook2Id == Null ){
            oppRec.Pricebook2Id =  priceBookId;
            update oppRec;
        }

        for(PricebookEntry pbe : [Select id,Product2Id ,UnitPrice from PricebookEntry where Pricebook2Id =: priceBookId AND Product2Id IN :ProdList]){
			productPricebookMap.put(pbe.Product2Id,pbe);
		}

		for (String  prop : propList){
			for (String prod : ProdList){
				OpportunityLineItem OppItem = new OpportunityLineItem();
			   OppItem.OpportunityId =  oppId;
			   OppItem.Product2Id = Id.valueof(prod) ;
			   OppItem.PricebookEntryId =productPricebookMap.get(prod).id;
			   OppItem.UnitPrice = productPricebookMap.get(prod).UnitPrice;
			   OppItem.Property__c= prop;
			   oli.add(OppItem);
			}
		}
        insert oli;

        for(OpportunityLineItem olirec :oli){
            oliIdList.add(olirec.id);
        }  
        return oliIdList;

}
    
    public class getPriceBookInfowrapper{
        public String priceBookName;
        public string priceBookrecId;
    }
    
}