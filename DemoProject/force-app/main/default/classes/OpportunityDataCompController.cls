public inherited sharing class OpportunityDataCompController {
    private static final String PERCENTILE='%';
    private static final String SEARCHQUERY='SELECT Id,AccountName__c,Name,CloseDate,Amount,StageName from Opportunity WHERE NAME LIKE :searchKey OR AccountName__c LIKE :searchKey ORDER BY NAME LIMIT :queryLimit';
    @AuraEnabled
    public static List<Sobject> getOpportunitesData(){
        return [SELECT Id,AccountName__c,Name,CloseDate,Amount,StageName from Opportunity ORDER BY Name LIMIT :getQueryLimitValue() ];
    }
    private static Integer getQueryLimitValue(){
        return Limits.getLimitQueryRows()-Limits.getQueryRows();
    }
    @AuraEnabled
    public static List<Sobject> getOppportunitidBasedOnKey(string searchKey){
        if(string.isNotBlank(searchKey)){
            Integer queryLimit=getQueryLimitValue();
            searchKey=PERCENTILE+searchKey+PERCENTILE;
            return Database.query(SEARCHQUERY);
        }
        else
            return getOpportunitesData();
    }
}