
import { User as SFDC_User } from "../../../backend/sfdc/model/User";
import { User } from "../../../myuss/models/user.model";

export class SFDC_UserMapper {
    static getMyUSSUserFromSFDCUser(sfdcUser : SFDC_User): User {
        const myUSSUser = new User();
        myUSSUser.id = sfdcUser.Id;
        myUSSUser.firstName = sfdcUser.FirstName;
        myUSSUser.lastName = sfdcUser.LastName;
        myUSSUser.name = sfdcUser.Name;
        return myUSSUser;
    }
    static getSFDCUserFromMyUSSUser(myUSSUser: User): SFDC_User {
        const sfdcUser = new SFDC_User();
        sfdcUser.FirstName = myUSSUser.firstName;
        sfdcUser.LastName = myUSSUser.lastName;
        return sfdcUser;
    }
           
}
