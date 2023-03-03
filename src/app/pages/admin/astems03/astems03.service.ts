import {Injectable} from '@angular/core';
import {JHttpService} from '../../../shared/services/jhttp.service';
import {ApiResult} from '../../../shared/vo/api-result';
import {APPCONSTANTS} from '../../../shared/constants/appconstants';


@Injectable({
  providedIn: 'root'
})
export class Astems03Service {

  

  httpUrl = `${APPCONSTANTS.BASE_URL_WM}/receive-service/rcv/rcvInstruct`;

  openWeatherUrl = `http://api.openweathermap.org/data/2.5`;

  constructor(private http: JHttpService) {
  }

  // 조회함수
  async get(searchData: {}): Promise<ApiResult<RcvAcceptVO[]>> {
    // 조회 Api 설정
    const baseUrl = `${this.httpUrl}/findRcvInstruct`;
    try {
      // Post 방식으로 조회
      const result = await this.http.post<ApiResult<RcvAcceptVO[]>>(baseUrl, searchData).toPromise();
      return result;
    } catch {
      return {
        success: false,
        data: null,
        code: '-999',
        msg: 'Post service api error!'
      };
    }
  }

  // 조회함수
  async getInstructed(searchData: {}): Promise<ApiResult<RcvAcceptVO[]>> {
    // 조회 Api 설정
    const baseUrl = `${this.httpUrl}/findRcvInstructed`;
    try {
      // Post 방식으로 조회
      const result = await this.http.post<ApiResult<RcvAcceptVO[]>>(baseUrl, searchData).toPromise();
      return result;
    } catch {
      return {
        success: false,
        data: null,
        code: '-999',
        msg: 'Post service api error!'
      };
    }
  }

  // 지시결과 조회
  async findRcvTagDetail(searchData: {}): Promise<ApiResult<RcvTagDetailVO[]>> {
    // 조회 Api 설정
    const baseUrl = `${this.httpUrl}/findRcvTagDetail`;
    try {
      // Post 방식으로 조회
      const result = await this.http.post<ApiResult<RcvTagDetailVO[]>>(baseUrl, searchData).toPromise();
      return result;
    } catch {
      return {
        success: false,
        data: null,
        code: '-999',
        msg: 'Post service api error!'
      };
    }
  }

  // 적치지시
  async executeInstruct(searchData: {}): Promise<ApiResult<RcvAcceptVO>> {
    // 조회 Api 설정
    const baseUrl = `${this.httpUrl}/executeInstruct`;
    try {
      // Post 방식으로 조회
      const result = await this.http.post<ApiResult<RcvAcceptVO>>(baseUrl, searchData).toPromise();
      return result;
    } catch {
      return {
        success: false,
        data: null,
        code: '-999',
        msg: 'Post service api error!'
      };
    }
  }

  // MAP //
  async reverseGeocoding(data: any): Promise<any> {
    const UserAppKey = 'l7xx46f9c83cb35e4db9abd67c564f44181e';
    const sendUrl = `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&format=json&callback=result&appKey=${UserAppKey}&coordType=WGS84GEO&addressType=A10&lat=${data.lat}&lon=${data.lon}`;

    try{
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', sendUrl, true);
        xhr.responseType = 'json';
        xhr.send();

        xhr.onload = (e) => {

          if (xhr.status === 200) {
            let result = xhr.response;
            result = JSON.stringify(result);
            result = JSON.parse(result);
            resolve(result);
          } else{
            reject(null);
          }
        };
      });
    }catch {
      return null;
    }
  }

  async getCurrentWeather(lat: string, lon: string, country: string): Promise<WeatherApiVO[]> {
    let sendUrl;

    if (country) {
      sendUrl = `${this.openWeatherUrl}/weather?q=${country}&appid=${APPCONSTANTS.OPEN_WEATHER_API_KEY}&units=metric&lang=kr`;
    } else {
      sendUrl = `${this.openWeatherUrl}/weather?lat=${lat}&lon=${lon}&appid=${APPCONSTANTS.OPEN_WEATHER_API_KEY}&units=metric&lang=kr`;
    }

    try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('get', sendUrl, true);
          xhr.responseType = 'json';
          xhr.send();

          xhr.onload = (e) => {

            if (xhr.status === 200) {
              let result = xhr.response;

              result = JSON.stringify(result);
              result = JSON.parse(result);
              resolve(result);
            } else{
              reject(null);
            }
          };
        });
    } catch {
      return null;
    }
  }

  getForecast(lat: string, lon: string, country: string): Promise<WeatherApiListVO[]> {
    let sendUrl;

    if (country) {
      sendUrl = `${this.openWeatherUrl}/forecast?q=${country}&appid=${APPCONSTANTS.OPEN_WEATHER_API_KEY}&units=metric&cnt=10&lang=kr`;
    } else {
      sendUrl = `${this.openWeatherUrl}/forecast?lat=${lat}&lon=${lon}&appid=${APPCONSTANTS.OPEN_WEATHER_API_KEY}&units=metric&cnt=10&lang=kr`;
    }

    try{
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', sendUrl, true);
        xhr.responseType = 'json';
        xhr.send();

        xhr.onload = (e) => {

          if (xhr.status === 200) {
            let result = xhr.response;

            result = JSON.stringify(result);
            result = JSON.parse(result);
            resolve(result);
          } else{
            reject(null);
          }
        };
      });
    }catch {
      return null;
    }
  }

  // MAP //

}

export interface RcvAcceptVO {
  uid: number;
  tenant: string;
  acceptKey: string;
  acceptTypecd: string;
  acceptGroupcd: string;
  actFlg: string;
  warehouseId: number;
  logisticsId: number;
  locId: number;
  inspectedUserId: number;
  carrierId: number;
  carrier: string;
  carrierName: string;
  carrierNo: string;
  carrierWbNo: string;
  carrierRefName: string;
  actualTime: Date;
  completeTime: Date;
  acceptlinetotal: number;
  tagLabelPrintFlg: string;
  rcvId: number;
  acceptUserId: number;
  belongingCompany: number; // TODO 알포터용 (화주 대체용 소속회사)

  createdDatetime: Date;
  createdBy: string;
  modifiedDatetime: Date;
  modifiedBy: string;
}

export interface RcvTagDetailVO {
  tenant: string;
  uid: number;

  rcvAcceptId: number;
  rcvAcceptLineNo: number;
  rcvId: number;
  rcvDetailId: number;
  actFlg: string;
  sts: string;
  ownerId: number;
  itemAdminId: number;
  itemId: number;
  ifItem: string;
  lot1: string;
  lot2: string;
  lot3: string;
  lot4: string;
  lot5: string;
  lot6: string;
  lot7: string;
  lot8: string;
  lot9: string;
  lot10: string;
  damageFlg: string;
  noShippingFlg: string;
  foreignCargoFlg: string;
  customsReleaseFlg: string;
  taxFlg: string;
  whInDate: Date;
  mngDate: Date;
  logisticsId: number;
  warehouseId: number;
  slotFlg: string;
  toLocId: number;
  locId: number;
  lotId: number;
  tagId: number;
  oddsFlg: string;
  instructQty1: number;
  instructQty2: number;
  instructQty3: number;
  loadQty1: number;
  loadQty2: number;
  loadQty3: number;
  labelPrintedFlg: string;
  soId: number;
  soDetailId: number;
  prospectFlg: string;
  prospectUpdateFlg: string;
  slotType: string;
  slottedUserId: number;
  xdockOrderId: number;
  pickId: number;
}

// MAP //

export interface WeatherApiListVO {
  cod: string;
  message: string;
  cnt: string;
  list: WeatherApiVO[];
}

export interface WeatherApiVO {
  coord: string;
  weather: WeatherApiWeatherVO[];
  base: string;
  main: WeatherApiMainVO;
  visibility: string;
  wind: string;
  clouds: string;
  rain: string;
  snow: string;
  dt: Date;
  sys: string;
  timezone: string;
  id: string;
  name: string;
  code: string;
}

export interface WeatherApiMainVO {
  temp: string;
  feels_like: string;
  temp_min: string;
  temp_max: string;
  pressure: string;
  sea_level: string;
  grnd_level: string;
  humidity: string;
  temp_kf: string;
}

export interface WeatherApiWeatherVO {
  id: string;
  main: string;
  description: string;
  icon: string;
}

// MAP //
