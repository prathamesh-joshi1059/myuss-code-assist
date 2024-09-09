import { Tasks as SFDC_Tasks} from "../../../backend/sfdc/model/Tasks";
import { Tasks } from "../../../myuss/models/tasks";

export class SFDC_TaskMapper {
    public static getMyUSSTasksFromSFDCTasks(sfdcTasks: SFDC_Tasks): Tasks {
        const tasks =  new Tasks();
        tasks.id = sfdcTasks.Id;
        tasks.subject = sfdcTasks.Subject;
        tasks.description = sfdcTasks.Description;
        tasks.activityDate = sfdcTasks.ActivityDate;
        tasks.taskSubtype = sfdcTasks.TaskSubtype;
        tasks.createdDate = sfdcTasks.CreatedDate;
        return tasks;
        }
    public static getSFDCTasksFromMyUSSTasks(tasks: Tasks): SFDC_Tasks {
        const sfdcTasks =  new SFDC_Tasks();
        sfdcTasks.Id = tasks.id;
        sfdcTasks.Subject = tasks.subject;
        sfdcTasks.Description = tasks.description;
        sfdcTasks.ActivityDate = tasks.activityDate;
        sfdcTasks.TaskSubtype = tasks.taskSubtype;
        sfdcTasks.CreatedDate = tasks.createdDate;
        return sfdcTasks;
        }
}