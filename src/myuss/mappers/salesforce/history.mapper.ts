import { History as SFDC_History } from '../../../backend/sfdc/model/History';
import { History } from '../../models/history';

export class SFDC_HistoryMapper{

    public static getMyUSSHistoryFromSFDCHistory(sfdcHistory: SFDC_History): History {
        const myUSSHistory = new History();
        myUSSHistory.id = sfdcHistory.Id;
        myUSSHistory.field = sfdcHistory.Field;
        myUSSHistory.oldValue = sfdcHistory.OldValue;
        myUSSHistory.newValue = sfdcHistory.NewValue;
        myUSSHistory.createdDate = sfdcHistory.CreatedDate;
        return myUSSHistory;
    }
    public static getSFDCHistoryFromMyUSSHistory(myUSSHistory: History): SFDC_History {
        const sfdcHistory = new SFDC_History();
        sfdcHistory.Id = myUSSHistory.id;
        sfdcHistory.Field = myUSSHistory.field;
        sfdcHistory.OldValue = myUSSHistory.oldValue;
        sfdcHistory.NewValue = myUSSHistory.newValue;
        sfdcHistory.CreatedDate = myUSSHistory.createdDate;
        return sfdcHistory;
    }
}