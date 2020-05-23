public with sharing class ProductListCtrl {

    public class Filters {
        @AuraEnabled
        public String fieldApiName { get;set; }
        @AuraEnabled
        public String fieldvalue { get;set; }
        @AuraEnabled
        public String fieldType { get;set; }
        @AuraEnabled
        public String fieldOperator { get;set; }
    }

    public class ProductFilterWrapper{

        @AuraEnabled
        public String strSobjectFieldName    {get; set;}
        @AuraEnabled
        public String strSobjectFieldLabel    {get; set;}
        @AuraEnabled
        public String strSobjectFieldType    {get; set;}
        @AuraEnabled
        public String fieldOperator 		{ get; set; }

        public ProductFilterWrapper(String strSobjectFieldName, String strSobjectFieldLabel, String strSobjectFieldType, String fieldOperator){

            this.strSobjectFieldName = 'Product2.' + strSobjectFieldName;
            this.strSobjectFieldLabel = strSobjectFieldLabel;
            this.strSobjectFieldType = strSobjectFieldType;
            this.fieldOperator = fieldOperator;
        }
    }

    public class selectOptions{
        
        @AuraEnabled 
        public String strLabel {get;set;}
        @AuraEnabled
        public String strValue	{get; set;}
        
        public selectOptions(String strLabel, String strValue){
            
            this.strLabel = strLabel;
            this.strValue = strValue;
        }
    }

    public static Map<String, String> mapOperatorNameToValue = new Map<String, String>{
        
            'equals' => ' = ',
            'greater or equal' => ' >= ',
            'greater than' => ' > ',
            'less or equal' => ' <= ',
            'less than' => ' < ',
            'not equal to' => ' != '
    };
    
    @AuraEnabled(cacheable=true)
    public static List<ProductFilterWrapper> getProductFilters(){
        
        List<ProductFilterWrapper> lstColumns = new List<ProductFilterWrapper>();

        for(Product_Selector_Filters__mdt objMdt: [Select Id, Label, API_Name__c, Field_Type__c , Filter_Label__c, Sort_Order__c, Filter_Operator__c 
                                                   From Product_Selector_Filters__mdt 
                                                    Order by Sort_Order__c ASC ]){
			
            lstColumns.add(new ProductFilterWrapper(objMdt.API_Name__c, objMdt.Filter_Label__c, objMdt.Field_Type__c, objMdt.Filter_Operator__c));
            
        }

        return lstColumns;
        
    }
    
    public static String getCriteria(String filters){
        
        String strWhereClause = '';
        List<String>  criteria = new List<String>();
        
        if(String.isEmpty(filters)) return strWhereClause;
        
       	List<Filters> productFilters = (List<Filters>) System.JSON.deserializeStrict(filters, List<ProductListCtrl.Filters>.class);
        
        for(Filters objFilter : productFilters){
            
            String strOperatorName = objFilter.fieldOperator;
            String strFieldName = objFilter.fieldApiName;
            strFieldName = (strFieldName.startsWithIgnoreCase('Product2.')) ? strFieldName : 'Product2.' + strFieldName;
            
            String fieldVal = objFilter.fieldvalue;
            
            if(!String.isEmpty(fieldVal))
            	fieldVal = String.escapeSingleQuotes(fieldVal);
            
            if(objFilter.fieldType == 'Picklist' && fieldVal == 'None') continue;
            
            if(mapOperatorNameToValue.containsKey(strOperatorName)){
                
                if(objFilter.fieldType == 'Picklist' || objFilter.fieldType == 'Text')
					fieldVal = '\'' + fieldVal + '\'';
                
                String strCriteria = strFieldName + mapOperatorNameToValue.get(strOperatorName) + fieldVal;
                criteria.add( strCriteria);   
            }
            else{
                
                if(strOperatorName == 'contains'){
                    
                    fieldVal = '%' + fieldVal + '%';
                    String strCriteria = strFieldName + ' LIKE \'' + fieldVal + '\'';
                    criteria.add(strCriteria);
                }
                else if(strOperatorName == 'does not contain'){
                    
                    fieldVal = '%' + fieldVal + '%';
                    String strCriteria =  ' NOT ' + strFieldName + ' LIKE \'' + fieldVal + '\'';
                    criteria.add( strCriteria);
                }
            }
        }
        
        if (criteria.size() > 0) {
            strWhereClause =   String.join( criteria, ' AND ' );
        }                      
       
        return strWhereClause;
    } 
    
    
    @AuraEnabled(cacheable=true)
    public static List<Products_Selector_Columns__mdt> getProductColumns(){
       
        List<Products_Selector_Columns__mdt> lstProductColumn = new List<Products_Selector_Columns__mdt>();

		lstProductColumn =  [Select  Label, Field_API_Name__c, Field_Type__c , 
                                Sort_Order__c 
                                From Products_Selector_Columns__mdt 
                                Order by Sort_Order__c  ASC ];  
        
        return lstProductColumn;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static Integer getProductsCount(String pricebookId, String filters){
        
        if(String.isEmpty(pricebookId)) return null;
		
        String  strWhereClause = '';
        
        if (!String.isEmpty(filters)) 
        	strWhereClause = getCriteria(filters);
        
        if(String.isEmpty(strWhereClause))
            strWhereClause = ' WHERE Pricebook2Id =: pricebookId AND Product2.IsActive = True AND IsActive = TRUE  ';
        else 
        	strWhereClause = ' WHERE Pricebook2Id =: pricebookId AND Product2.IsActive = True AND IsActive = TRUE AND ' + strWhereClause;
        
        String strAggQuery = 'Select Count(Id) cnt From PriceBookEntry ' + strWhereClause ;
        
       	AggregateResult agg =    Database.query(strAggQuery);
        Integer totalProducts = Integer.valueOf( agg.get('cnt')); 

        return totalProducts;
    }
   
    @AuraEnabled(cacheable=true)
    public static List<PriceBookEntry> getProducts(String pricebookId, List<String> fields, String filters, String sortBy, String sortDir, Integer offset){
		
        if(String.isEmpty(pricebookId) || fields.isEmpty()) return null;
        
        String  strSelectClause = '';
        String  strWhereClause = '';
        String strOrderBy = '';
        
        List<String> lstProductFields = new List<String>();
        Set<String> setProductFields = new Set<String>{'Id'};
		
		setProductFields.add('Product2.Id');
		setProductFields.addAll(fields);
        lstProductFields.addAll(setProductFields);
        
        strSelectClause = String.join(lstProductFields, ',');
        
        
        if(String.isEmpty(sortBy))
            strOrderBy = ' Product2.NAME ASC ';
        else{
            
            if(sortBy != 'UnitPrice') sortBy = 'Product2.' + sortBy;
            strOrderBy = sortBy + ' ' + ((String.isEmpty(sortDir)) ? 'ASC' :  sortDir) ;
        }
        
        if (!String.isEmpty(filters)) 
            strWhereClause = getCriteria(filters);
        
        if(String.isEmpty(strWhereClause))
			strWhereClause = ' WHERE Pricebook2Id =: pricebookId AND Product2.IsActive = True AND IsActive = TRUE ';
		else
            strWhereClause = ' WHERE Pricebook2Id =: pricebookId AND Product2.IsActive = True AND IsActive = TRUE AND ' + strWhereClause;
       
        
        String strQuery = 'Select ' + strSelectClause + ' FROM PriceBookEntry ' + strWhereClause 
            				+ ' ORDER BY ' + strOrderBy +  ' limit 50 ' + ' OFFSET ' + offset;
        
        System.debug('=====strQuery===' + strQuery);
        List<PriceBookEntry> lstProducts = Database.query(strQuery);
        System.debug('=====lstProducts===' + lstProducts);
        
        return lstProducts;
    }
    
    @AuraEnabled
    public static string createOppLineItems(String oppId, String pricebookId, List<String> lstPBEIds) {
        
        List<OpportunityLineItem> lstOLIs = new List<OpportunityLineItem>();
        
        for(PriceBookEntry objPBE : [SELECT Product2.Id, Product2.Name, UnitPrice,  Product2.Description 
                                           FROM PriceBookEntry 
                                          WHERE Pricebook2Id =:pricebookId AND
                                     	Id IN : lstPBEIds]){
            

            OpportunityLineItem objOLI = new OpportunityLineItem();
            objOLI.OpportunityId = oppId;
            objOLI.PricebookEntryId =  objPBE.Id;
            objOLI.UnitPrice = objPBE.UnitPrice;
            objOLI.Quantity = 1;
            objOLI.Unit_of_Measure__c = 'LBS';
			
            lstOLIs.add(objOLI);
        }

        insert lstOLIs;
        
        return 'success';
    }

    @AuraEnabled(cacheable=true)
    public static List<selectOptions> getPicklistOptions(String fieldApiName){
        
        String objectName = 'OpportunityLineItem';
        
        List<selectOptions> lstOptions = new List<selectOptions>();
        
        Schema.SObjectType s = Schema.getGlobalDescribe().get(objectName) ;
        Schema.DescribeSObjectResult r = s.getDescribe() ;
        Map<String,Schema.SObjectField> fields = r.fields.getMap() ;
        Schema.DescribeFieldResult fieldResult = fields.get(fieldApiName).getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        
        for( Schema.PicklistEntry pickListVal : ple){
            
            lstOptions.add(new selectOptions(pickListVal.getLabel(),pickListVal.getValue() ));
        }    
        
        return lstOptions;
    }
    
}