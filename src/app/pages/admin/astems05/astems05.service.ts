

import {Injectable} from '@angular/core';
import {APPCONSTANTS} from '../../../shared/constants/appconstants';
import {JHttpService} from '../../../shared/services/jhttp.service';
import {ApiResult} from '../../../shared/vo/api-result';
import {COMMONINITDATA} from '../../../shared/constants/commoninitdata';

@Injectable({
  providedIn: 'root'
})
export class Astems05Service {
  // 기본 URL 선언
  httpUrl = `${APPCONSTANTS.BASE_URL_WM}/master-service/precard`;

  // http 객체 Injection
  // private dsProcType: any;

  constructor(private http: JHttpService) {
  }

  async sendPost(data: any, command?: string): Promise<ApiResult<any>> {
    const url = `${this.httpUrl}/${command}`;

    try {
      return await this.http.post<ApiResult<any>>(url, data).toPromise();
    } catch (e) {
      return COMMONINITDATA.DEFAULT_POST_API_ERROR;
    }
  }
}


