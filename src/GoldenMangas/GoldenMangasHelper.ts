import { Response } from 'paperback-extensions-common'
import { Request } from 'paperback-extensions-common/dist/models/RequestObject'
import { RequestManagerInfo } from 'paperback-extensions-common/dist/models/RequestManager'

export interface GMResponse extends Response {
    fixedData: string;
}
export interface GMRequestManager extends RequestManagerInfo {
    schedule: (request: Request, retryCount: number) => Promise<GMResponse>;
}
