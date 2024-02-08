import { type infer as zInfer, type ZodSchema } from 'zod';
import {
  dataProtectionContentRequestedWebhookDataSchema,
  dataProtectionScanTriggeredWebhookDataSchema,
  dataProtectionObjectDeletedWebhookDataSchema,
  dataProtectionDeleteObjectPermissionsRequestedDataSchema,
  dataProtectionRefreshObjectRequestedWebhookDataSchema,
  thirdPartyAppsScanTriggeredWebhookDataSchema,
  thirdPartyAppsRefreshObjectRequestedWebhookDataSchema,
  thirdPartyAppsDeleteObjectRequestedWebhookDataSchema,
} from '@elba-security/schemas';
import { ElbaError } from '../error';

const eventDataSchema = {
  'third_party_apps.scan_triggered': thirdPartyAppsScanTriggeredWebhookDataSchema,
  'third_party_apps.refresh_object_requested': thirdPartyAppsRefreshObjectRequestedWebhookDataSchema,
  'third_party_apps.delete_object_requested': thirdPartyAppsDeleteObjectRequestedWebhookDataSchema,
  'data_protection.scan_triggered': dataProtectionScanTriggeredWebhookDataSchema,
  'data_protection.content_requested': dataProtectionContentRequestedWebhookDataSchema,
  'data_protection.object_deleted': dataProtectionObjectDeletedWebhookDataSchema,
  'data_protection.refresh_object_requested': dataProtectionRefreshObjectRequestedWebhookDataSchema,
  'data_protection.delete_object_permissions_requested': dataProtectionDeleteObjectPermissionsRequestedDataSchema,
} as const satisfies Record<string, ZodSchema>;

export type WebhookEvent = keyof typeof eventDataSchema;

export const parseWebhookEventData = <T extends WebhookEvent>(
  event: T,
  data: unknown
): zInfer<(typeof eventDataSchema)[T]> => {
  const eventDataParseResult = eventDataSchema[event].safeParse(formatData(data));

  if (!eventDataParseResult.success) {
    throw new ElbaError('Could not validate webhook event data', {
      cause: eventDataParseResult.error,
    });
  }

  return eventDataParseResult.data;
};

const formatData = (data: unknown) => {
  if (data instanceof URLSearchParams) {
    return Object.fromEntries(data.entries());
  }
  return data;
};
