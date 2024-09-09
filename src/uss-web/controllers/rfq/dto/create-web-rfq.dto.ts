import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRFQDto {
  rfq_id: string; // "sdfsdjwevoijwefi";
  action: string; //  "sfmc_function_data";
  crm_kindofuse: string; //  "construction";
  crm_rentalpurpose: string; //  "business";
  crm_daytimephone: string; //  "5415549030";
  crm_prospectfirstname: string; //  "Adam";
  crm_prospectlastname: string; //  "Studdard";
  crm_email: string; //  "astuddard@gmail.com";
  crm_deliveryzip: string; //  "05403";
  crm_companyname: string; // "MyUSS Test";
  crm_state: string; // "VT";
  crm_startdate: Date; //  "08/04/2023";
  crm_enddate: Date; //  "";
  crm_rentalduration: string; //  "3 to 5 Months";
  crm_consent: string; //  "on";
  crm_standardproducts: string; //Product[];
  crm_specialtyproducts: string; // Product[];
}

export class Product {
  category: string;
  name: string;
  quantity: number;

  constructor(category: string, name: string, quantity: number) {
    this.category = category;
    this.name = name;
    this.quantity = quantity;
  }
}