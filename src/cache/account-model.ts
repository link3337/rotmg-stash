import { CharListResponseUIModel } from "@api/models/charlist-response-ui-model";
import { QueueStatusType } from "@store/slices/QueueSlice";


export interface AccountModel {
  /**
   * The unique identifier for the account.
   */
  id: string;

  /**
   * The email address associated with the account.
   */
  email: string;

  /**
   * The password for the account.
   */
  password: string;

  /**
   * Indicates whether the account is active.
   */
  active: boolean;

  /**
   * The last saved timestamp for the account data.
   */
  lastSaved?: string;

  /**
   * The mapped data from the character list response.
   */
  mappedData?: CharListResponseUIModel;

  /**
   * Any error message associated with the account.
   */
  error?: string | undefined;

  /**
   * The queue status type for the account.
   */
  queueStatus?: QueueStatusType;
}
