import { Address, Contact } from ".";


export class Project {
    id?: string;
    name?: string;
    projectNumber?: string;
    description?: string;
    category?: string;
    projectType?: string;
    stage?:string;
    status?: string;
    startDate?:string;
    endDate?: string;
    createdDate?: string;
    lastModifiedDate?: string;
    accountId?: string;
    noOfQuotes?: number;
    noOfOrders?: number;
    address?: Address;
    contact?: Contact;
    casesCount?: number;
  }

 