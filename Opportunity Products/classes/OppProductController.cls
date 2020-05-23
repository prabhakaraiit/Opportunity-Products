public with sharing class OppProductController {

    public class OppProductWrapper{
        
        @AuraEnabled 
        public List<Product_Summary_Columns__mdt> lstColumns {get;set;}
        @AuraEnabled
        public List<OpportunityLineItem> lstLineItems	{get; set;}
        
        public OppProductWrapper(List<Product_Summary_Columns__mdt> lstColumns, List<OpportunityLineItem> lstLineItems){
            
            this.lstColumns = lstColumns;
            this.lstLineItems = lstLineItems;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Opportunity getOpportunityDetails(String oppId){
        
        if(!string.isEmpty(oppId)){
            
            Opportunity  objOpp = [Select Id, Pricebook2Id,  RecordType.DeveloperName 
                                  From Opportunity
                                  Where Id = : oppId];
            
            return objOpp;
        } else return null;
    }

 
    @AuraEnabled(cacheable=true)
    public static OppProductWrapper getOppLines(string strOppId,  String sortBy, String sortDir){
        
        List<String> lstOppLineFields = new List<String>();
        List<OpportunityLineItem> lstOppLines = new List<OpportunityLineItem>();
        List<Product_Summary_Columns__mdt> lstColumns = new List<Product_Summary_Columns__mdt>();
        
        Set<String> setOppLineFields = new Set<String>{'Id'};
        
        lstColumns = [Select API_Name__c , Editable__c , Field_Label__c , Sort_Order__c, Field_Type__c, 
                        DeveloperName , Wrap_Text__c 
                        From Product_Summary_Columns__mdt 
                        Order by Sort_Order__c ASC];
        
        for(Product_Summary_Columns__mdt objMdt: lstColumns){
            
            setOppLineFields.add(objMdt.API_Name__c);
        }
        
        lstOppLineFields.addAll(setOppLineFields);
        
        if(String.isEmpty(sortBy)) sortBy = 'CreatedDate';
        if(String.isEmpty(sortDir)) sortDir = 'ASC';
        
        String strSelectClause = String.join(lstOppLineFields, ',');
        String strQuery = 'Select ' + strSelectClause + 
            				' From OpportunityLineItem Where OpportunityId =: strOppId Order By ' + sortBy  + ' ' + sortDir;
		
        lstOppLines = Database.query(strQuery);
                                        
        return new OppProductWrapper(lstColumns, lstOppLines);
    }
	
    @AuraEnabled
    public static String saveOppLineItems(List<OpportunityLineItem> lstLineItems){
        
        update lstLineItems;
        
        return 'success';
    }

    @AuraEnabled
    public static String deleteOppLineItems(List<String> lstLineItemsIds){
		
        List<OpportunityLineItem> lstOLIs = new List<OpportunityLineItem>();
        Set<String> setOppLineIds = new Set<String>();
        
        setOppLineIds.addAll(lstLineItemsIds);
        
        if(setOppLineIds.isEmpty()) return 'Error';

        lstOLIs = [Select Id From OpportunityLineItem Where Id IN : setOppLineIds];
        
        delete lstOLIs;
        
        return 'success';
    }
}