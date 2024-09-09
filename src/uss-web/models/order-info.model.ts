export class OrderInfo {
  status_code: string;
  order_start_date: Date;
  order_no: string;
  order_status: string;
  purchase_order_no: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  job_sites: JobSite[];
}

export class JobSite {
  id: string;
  name: string;
  placement_notes: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  site_visits: SiteVisit[];
  timezone: any;
}

export class SiteVisit {
  work_type: string;
  status: string;
  date_time: Date;
  // start_date: Date;
  // scheduled_time: Date;
  // actual_completion_time: Date;
  summary: string;
}
