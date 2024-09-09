import { OrderInfo } from "../../../models/order-info.model";

export class OrderInfoTestDataProvider {
  public static getTestOrderInfo(): OrderInfo {
    return this.goodOrderInfo;
  }

  private static goodOrderInfo: OrderInfo = {
    status_code: 'OK',
    order_no: '123456789',
    order_status: 'Activated',
    order_start_date: new Date('2023-10-01T00:00:00.000Z'),
    purchase_order_no: '123456789',
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipcode: '12345',
    latitude: 123.456,
    longitude: 123.456,
    job_sites: [
      {
        id: '123456789',
        name: 'Site 1',
        placement_notes: 'Placement Notes',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipcode: '12345',
        latitude: 123.456,
        longitude: 123.456,
        timezone: 'America/Los_Angeles',
        site_visits: [
          {
            work_type: 'Delivery',
            status: 'Completed',
            date_time: new Date('2023-10-01T00:00:00.000Z'),
            // start_date: new Date('2023-10-01T00:00:00.000Z'),
            // scheduled_time: new Date('2023-10-01T00:00:00.000Z'),
            // actual_completion_time: new Date('2023-10-01T02:00:00.000Z'),
            summary: 'Summary',
          },
          {
            work_type: 'Service',
            status: 'Completed',
            date_time: new Date('2023-10-10T00:00:00.000Z'),
            // start_date: new Date('2023-10-10T00:00:00.000Z'),
            // scheduled_time: new Date('2023-10-10T00:00:00.000Z'),
            // actual_completion_time: new Date('2023-10-10T02:00:00.000Z'),
            summary: 'Summary',
          },
          {
            work_type: 'Service',
            status: 'Scheduled',
            date_time: new Date('2023-10-31T00:00:00.000Z'),
            // start_date: new Date('2023-10-31T00:00:00.000Z'),
            // scheduled_time: new Date('2023-10-31T00:00:00.000Z'),
            // actual_completion_time: new Date('2023-10-31T00:00:00.000Z'),
            summary: 'Summary',
          },
        ],
      },
    ],
  };
}