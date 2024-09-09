import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';
import { Branch } from '../../../uss-web/models/branch.model';

@Injectable()
export class BranchService {
  constructor(
    private firestoreService: FirestoreService,
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

  async getBranchById(id: string): Promise<Branch | null> {
    const doc = await this.firestoreService.getDocument('branches', id);
    if (!doc || doc.exists === false) {
      return null;
    }
    const branch = new Branch();
    branch.id = id;
    branch.name = doc.data().name;
    branch.area_name_sales = doc.data().area_name_sales;
    branch.region_name = doc.data().region_name;
    branch.rfq_enabled = doc.data().rfq_enabled;
    return branch;
  }

  async getEligibleBranches(): Promise<Branch[]> {
    const branches = await this.getBranches();
    return branches.filter((branch) => branch.rfq_enabled);
  }

  async refreshBranchesFromSalesforce(): Promise<void> {
    const serviceTerritories = await this.sfdcServiceTerritoryService.getBranchLevelTerritories();
    const branches = await this.getBranches();

    const newBranches = serviceTerritories
      .filter((serviceTerritory) => {
        return !branches.find((branch) => branch.id === serviceTerritory.Service_Branch_Id__c);
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

    await Promise.all(newBranches.map(async (branch) => {
      await this.firestoreService.createDocument('branches', branch.id, branch);
    }));
  }
}