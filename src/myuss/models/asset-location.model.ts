export class AssetLocations {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  assetName: string;
  serviceName: string;
  quantity: number;
  parentAddress: string;
  siteAddress: string;
  siteAddressId: string;
  placementNote: string;
  subscriptionProductId: string;
  serviceProductId: string;
  jobsiteId: string;
  bundleName: string;
  bundleId: string;
  isEdited?: string;
  ancillaryServiceList: [];
  serviceSubscriptionId: string;
  assetId: string;
  serviceId: string;
  unitNumber: string;
  orderNumber?: string;
  contractId?: string;
  orderStatus?: string;
  numberOfServices?: number;
  servicePrice?: number;
  isServiceContractedPrice?: boolean; // if true then don't show service per price
}
