export class SfmcRequestForQuote {
  crm_daytimephone: string; // => $_POST['crm_daytimephone'],
	crm_email: string; // => $_POST['crm_email'],
	crm_prospectlastname: string; //  => $_POST['crm_prospectlastname'],
	crm_prospectfirstname: string; //  => $_POST['crm_prospectfirstname'],
	crm_companyname: string; // ' => $_POST['crm_companyname'],
	crm_deliveryzip: string; // ' => $_POST['crm_deliveryzip'],
	crm_state: string; // ' => $_POST['crm_state'],
	crm_startdate: string; //  => $_POST['crm_startdate'],
	crm_kindofuse: string; // ' => $_POST['crm_kindofuse'],
	crm_rentalpurpose: string; // ' => $_POST['crm_rentalpurpose'],
	crm_rentalduration: string; // ' => $_POST['crm_rentalduration'],
	crm_enddate: string; // ' => $_POST['crm_enddate'],
	crm_standardproducts: string; // ' => '{'.$stan_products.'}',
	crm_specialtyproducts: string; // ' => '{'.$sfmc_spe_products.'}',
	acq_company: string; // ' => '',
	crm_web_lead_privacy_policy_opt_in: string; // '=>'yes',
	action: string; // ' => 'submit_quote',
	crm_consent: string; // ' => $_POST['crm_consent'],
	crm: number; // ' => 1,

    constructor() {
      this.acq_company = '';
      this.crm_web_lead_privacy_policy_opt_in = 'yes';
      this.action = 'submit_quote';
      this.crm = 1;
      this.crm_enddate = '';
    }

}