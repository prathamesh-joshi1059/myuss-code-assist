import { WorkOrder } from "../../../backend/sfdc/model/WorkOrder";
import { Contract } from "../../../backend/sfdc/model/Contract";
import { JobSite, OrderInfo, SiteVisit } from "../../models/order-info.model";

export class SFDC_ContractMapper {
  public static mapSFDCContractToOrderInfo(sfdcContract: Contract): OrderInfo {
    const orderInfo = new OrderInfo();
    orderInfo.status_code = 'OK';
    orderInfo.order_start_date = sfdcContract.StartDate;
    orderInfo.order_no = sfdcContract.Reference_Number__c;
    orderInfo.purchase_order_no = sfdcContract.Purchase_Order__r?.Name || '';
    orderInfo.order_status = sfdcContract.Status;
    orderInfo.street = sfdcContract.Ship_To_Street__c;
    orderInfo.city = sfdcContract.Ship_To_City__c;
    orderInfo.state = sfdcContract.Ship_To_State__c;
    orderInfo.zipcode = sfdcContract.Ship_To_Zip_Code__c;
    // orderInfo.latitude = 0;
    // orderInfo.longitude = 0;
    // map work orders to job sites
    const workOrders = sfdcContract.Work_Orders__r['records'] as WorkOrder[];
    if (workOrders) {
      orderInfo.job_sites = this.mapWorkOrdersToJobSites(workOrders);
      orderInfo.job_sites = this.sortWorkOrdersPerJobSite(orderInfo.job_sites);
    }
    return orderInfo;
  }
  
  static sortWorkOrdersPerJobSite(job_sites: JobSite[]): JobSite[] {
    const now = new Date();
    job_sites.forEach(job_site => {
      // for each jobsite, create two arrays - one for future and one for past
      const future = [];
      const past = [];
      // for each site visit, check if it is in the past or future
      job_site.site_visits.forEach(site_visit => {
        if (new Date(site_visit.date_time) >= now) {
          future.push(site_visit);
        } else {
          past.push(site_visit);
        }
      });
      // sort the future array by date ascending
      job_site.site_visits = future.sort((a, b) => {
        return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
      });
      // sort the past array by date descending and concat to the future array
      job_site.site_visits = job_site.site_visits.concat(past.sort((a, b) => {
        return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
      }));
    });
    return job_sites;
  }

  private static mapWorkOrdersToJobSites(workOrders: WorkOrder[]): JobSite[] {
    const jobSites: JobSite[] = [];
    // Map work orders to job sites
    workOrders.forEach(workOrder => {
      // check if job site already exists
      let jobSiteIdx = this.findOrCreateJobSite(jobSites, workOrder);
      // create site visit
      const siteVisit: SiteVisit = {
        work_type: workOrder.WorkType.Name,
        status: this.getStatusForWorkOrder(workOrder),
        date_time: this.getStartDateForWorkOrder(workOrder),
        summary: workOrder.Product_Information__c
      };
      // add site visit to job site
      jobSites[jobSiteIdx].site_visits.push(siteVisit);
    });
    return jobSites;
  }

  static getStartDateForWorkOrder(workOrder: WorkOrder): Date {
    // assign the dates progressively if they are populated
    // if the actual start is populated, use that, otherwise scheduled, otherwise start
    let startDate = null;
    startDate = workOrder.StartDate ? workOrder.StartDate : startDate;
    startDate = workOrder.Schedule_Start__c ? workOrder.Schedule_Start__c : startDate;
    startDate = workOrder.Actual_Start__c ? workOrder.Actual_Start__c : startDate;
    return startDate;
  }

  static getEndDateForWorkOrder(workOrder: WorkOrder): Date {
    // assign the dates progressively if they are populated
    // if the actual end is populated, use that, otherwise scheduled, otherwise end
    let endDate = null;
    endDate = workOrder.EndDate ? workOrder.EndDate : endDate;
    endDate = workOrder.Scheduled_End__c ? workOrder.Scheduled_End__c : endDate;
    endDate = workOrder.Actual_End__c ? workOrder.Actual_End__c : endDate;
    return endDate;
  }

  static getStatusForWorkOrder(workOrder: WorkOrder): string {
    // there should always be one SA
    if (workOrder.Service_Appointments__r && 
        workOrder.Service_Appointments__r['records'] && 
        workOrder.Service_Appointments__r['records'].length > 0) {
          const serviceAppointment = workOrder.Service_Appointments__r['records'][0];
          // if the Work Order is marked to be canceled, return canceled
          if (workOrder.Cancel__c == true) {
            return 'Canceled';
          } else { 
            return workOrder.Status;
          }
    }
    // fallback to work order status
    return workOrder.Status;
  }

  private static findOrCreateJobSite(jobSites: JobSite[], workOrder: WorkOrder): number {
    let jobSiteIdx = jobSites.findIndex(js => js.id === workOrder.Site_Address__c);
    if (jobSiteIdx === -1) {
      const jobSite = new JobSite();
      jobSite.id = workOrder.Site_Address__c;
      jobSite.name = workOrder.Site_Address__r.Site_Name__c;
      jobSite.placement_notes = workOrder.Site_Address__r.NF_Placement__c;
      jobSite.street = workOrder.Site_Address__r.USF_Street__c;
      jobSite.city = workOrder.Site_Address__r.USF_City__c;
      jobSite.state = workOrder.Site_Address__r.USF_State__c;
      jobSite.zipcode = workOrder.Site_Address__r.USF_Zip_Code__c;
      jobSite.latitude = workOrder.Site_Address__r.Address_Latitude_Longitude__Latitude__s;
      jobSite.longitude = workOrder.Site_Address__r.Address_Latitude_Longitude__Longitude__s;
      if (workOrder.Service_Appointments__r && workOrder.Service_Appointments__r['records'] && workOrder.Service_Appointments__r['records'].length > 0) {
        jobSite.timezone = workOrder.Service_Appointments__r['records'][0].TimeZone__c;
      }
      jobSite.site_visits = [];
      jobSites.push(jobSite);
      jobSiteIdx = jobSites.length - 1;
    }
    return jobSiteIdx;
  }
}