import { Event as SFDC_Event} from "../../../backend/sfdc/model/Event";
import { Event } from "../../../myuss/models/event";

export class SFDC_EventMapper {
    public static getMyUSSEventFromSFDCEvent(sfdcEvent: SFDC_Event): Event {
      const event =  new Event();
      event.id = sfdcEvent.Id;
      event.subject = sfdcEvent.Subject;
      event.description = sfdcEvent.Description;
      event.activityDate = sfdcEvent.ActivityDate;
      event.taskSubtype = sfdcEvent.TaskSubtype;
      event.createdDate = sfdcEvent.CreatedDate
      return event;
    }
    public static getSFDCEventFromMyUSSEvent(event: Event): SFDC_Event {
        const sfdcEvent =  new SFDC_Event();
        sfdcEvent.Id = event.id;
        sfdcEvent.Subject = event.subject;
        sfdcEvent.Description = event.description;
        sfdcEvent.ActivityDate = event.activityDate;
        sfdcEvent.TaskSubtype = event.taskSubtype;
        sfdcEvent.CreatedDate = event.createdDate;
        return sfdcEvent;
        }
    
}