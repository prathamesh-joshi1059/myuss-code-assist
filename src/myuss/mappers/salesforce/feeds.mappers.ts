import { Feeds as SFDC_Feeds} from "../../../backend/sfdc/model/Feeds";
import { Feeds } from "../../../myuss/models/feeds";

export class SFDC_FeedsMapper {
    
        public static getMyUSSFeedsFromSFDCFeeds(sfdcFeeds: SFDC_Feeds): Feeds {
            const feeds =  new Feeds();
            feeds.id = sfdcFeeds.Id;
            feeds.type = sfdcFeeds.Type;
            feeds.body = sfdcFeeds.Body;
            feeds.createdDate = sfdcFeeds.CreatedDate;
            return feeds;
            }
        public static getSFDCFeedsFromMyUSSFeeds(feeds: Feeds): SFDC_Feeds {
            const sfdcFeeds =  new SFDC_Feeds();
            sfdcFeeds.Id = feeds.id;
            sfdcFeeds.Type = feeds.type;
            sfdcFeeds.Body = feeds.body;
            sfdcFeeds.CreatedDate = feeds.createdDate;
            return sfdcFeeds;
            }
}