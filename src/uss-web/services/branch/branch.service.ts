import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';
import { Branch } from '../../../uss-web/models/branch.model';

@Injectable()
export class BranchService {

  constructor(private firestoreService: FirestoreService,
      private sfdcServiceTerritoryService: SfdcServiceTerritoryService
    ) {}

  async getBranches(): Promise<Branch[]> {
    const branches = await this.firestoreService.getCollectionDocs('branches');
    return branches.map((doc) => {
      const branch = new Branch();
      branch.id = doc.id;
      branch.name = doc.data().name;
      branch.area_name_sales = doc.data().area_name_sales;
      branch.region_name = doc.data().region_name;
      branch.rfq_enabled = doc.data().rfq_enabled;
      return branch;
    });
  }

  async getBranchById(id: string): Promise<Branch> {
    const doc = await this.firestoreService.getDocument('branches', id);
    if (!doc || doc.exists === false) {
      return null;
    }
    const branch = new Branch();
    branch.id = id;
    branch.name = doc.name;
    branch.area_name_sales = doc.area_name_sales;
    branch.region_name = doc.region_name;
    branch.rfq_enabled = doc.rfq_enabled;
    return branch;
  }

  async getEligibleBranches(): Promise<Branch[]> {
    const branches = await this.getBranches();
    return branches.filter((branch) => branch.rfq_enabled === true);
  }

  async refreshBranchesFromSalesforce(): Promise<void> {
    // get all the service territories from SFDC
    const serviceTerritories = await this.sfdcServiceTerritoryService.getBranchLevelTerritories();
    // get all the branches from Firestore
    const branches = await this.getBranches();
    // for each service territory, check if the branch exists in Firestore
    const newBranches = serviceTerritories
      .filter((serviceTerritory) => {
        const branch = branches.find((branch) => branch.id === serviceTerritory.Service_Branch_Id__c);
        return !branch;
      })
      .map((serviceTerritory) => {
          const branch = new Branch();
          branch.id = serviceTerritory.Service_Branch_Id__c;
          branch.name = serviceTerritory.Name;
          branch.area_name_sales = serviceTerritory.Area_Name__c;
          branch.region_name = serviceTerritory.Sales_Area__c;
          branch.rfq_enabled = false;
          return branch;
        });
    // if the branch does not exist, create the branch
    newBranches.forEach(async (branch) => {
      await this.firestoreService.createDocument('branches', branch.id, branch);
    });

  }

}
