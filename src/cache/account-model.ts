import { CharListResponseUIModel } from '@api/models/charlist-response-ui-model';
import { QueueStatusType } from '@store/slices/QueueSlice';

export interface AccountModel {
  id: string;
  email: string;
  password: string;
  active: boolean;
  lastSaved?: string;
  mappedData?: CharListResponseUIModel;
  error?: string | undefined;
  queueStatus?: QueueStatusType;
}
