import { SFDC_UserEventMapper } from "../../myuss/mappers/salesforce/user-event-mapper";
import { PortalActionModel } from "../../myuss/models/user-event.model";
import { Injectable } from '@nestjs/common';
import { SfdcPortalActionService } from "../../backend/sfdc/services/sfdc-portal-action/sfdc-portal-action.service";
import { CacheService } from "../cache/cache.service";

@Injectable()
export class TrackUserActionService {
    constructor(
        private readonly sfdcPortalActionService: SfdcPortalActionService,
        private readonly cacheService: CacheService
    ) {}

    public async setPortalActions(
        accountId: string,
        auth0Id: string,
        screenName: string,
        userAction: string,
        quoteId: string,
        ussOrderId: string
    ): Promise<void> {
        let userDetailsModel = await this.cacheService.get<string>('user-' + auth0Id);

        if (!userDetailsModel) {
            userDetailsModel = await this.sfdcPortalActionService.fetchContactAndUssPortalUser(auth0Id, accountId);
        } else {
            userDetailsModel = JSON.parse(userDetailsModel);
        }

        const portalActionModel = new PortalActionModel();
        portalActionModel.accountId = userDetailsModel.accountId;
        portalActionModel.contactId = userDetailsModel.contactId;
        portalActionModel.ussPortalUserId = userDetailsModel.ussPortalUserId;
        portalActionModel.name = screenName;
        portalActionModel.userAction = userAction;
        portalActionModel.quoteId = quoteId;
        portalActionModel.ussOrderId = ussOrderId;

        const portalAction = SFDC_UserEventMapper.getSFDCPortalActionsFromMyUSSPortalActions(portalActionModel);
        await this.sfdcPortalActionService.setPortalActions(portalAction);
    }
}