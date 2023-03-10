import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {CommonUtilService} from '../../../shared/services/common-util.service';
import {CodeService, CodeVO} from '../../mm/code/code.service';
import {CommonCodeService} from '../../../shared/services/common-code.service';
import {GridUtilService} from '../../../shared/services/grid-util.service';
import {DxFormComponent} from 'devextreme-angular/ui/form';
import {
  DxButtonComponent,
  DxDataGridComponent,
  DxFileUploaderComponent,
  DxLoadPanelComponent
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import {TranOrdMassService} from './tranordmass.service';
import * as XLSX from 'xlsx';
import {COMMONINITDATA} from '../../../shared/constants/commoninitdata';
import {CompanyService} from '../../mm/company/company.service';

@Component({
  selector: 'app-tranordmass',
  templateUrl: './tranordmass.component.html',
  styleUrls: ['./tranordmass.component.scss']
})
export class TranordmassComponent implements OnInit, AfterViewInit {

  constructor(public utilService: CommonUtilService,
              private service: CodeService,
              private codeService: CommonCodeService,
              private tranOrdMassService: TranOrdMassService,
              private companyService: CompanyService,
              public gridUtil: GridUtilService) {
    this.G_TENANT = this.utilService.getTenant();

    this.popupSaveClick = this.popupSaveClick.bind(this);
    this.popupCancelClick = this.popupCancelClick.bind(this);
  }

  @ViewChild('mainForm', {static: false}) mainForm: DxFormComponent;
  @ViewChild('mainGrid', {static: false}) mainGrid: DxDataGridComponent;
  @ViewChild('popupGrid', {static: false}) popupGrid: DxDataGridComponent;
  @ViewChild('popupForm', {static: false}) popupForm: DxFormComponent;
  @ViewChild('bookmarkBtn', {static: false}) bookmarkBtn: DxButtonComponent;
  @ViewChild('fileUploader', {static: false}) fileUploader: DxFileUploaderComponent;
  @ViewChild('loadPanel', {static: false}) loadPanel: DxLoadPanelComponent;

  // Global
  G_TENANT: any;
  pageInfo: any = this.utilService.getPageInfo();


  // ***** main ***** //
  // Form
  mainFormData = {
    fromRcvSchDate: null,
    toRcvSchDate: null
  };

  // Grid
  mainDataSource: DataSource;
  mainEntityStore: ArrayStore;
  key = 'uid';
  selectedRows: number[];
  // ***** main ***** //

  popupVisible = false;

  // ***** popup ***** //
  popupMode = 'Add';
  // Form
  popupFormData: any = {};
  // Grid
  popupDataSource: DataSource;
  popupEntityStore: ArrayStore;
  codeList: CodeVO[];

  // DataSet
  mainData = [];
  mainSearchData = [];
  dsCarType = [];
  dsCarKind = [];
  dsItemOption = [];
  dsOrdCategory = [];
  dsTranSalesType = [];
  dsIntervalType = [];
  dsCompanyList = [];
  dsItemPackType = [];

  // card ????????? ??????
  cardItems: any[] = [];
  // ????????? row ??????
  limitCnt = 3;
  // ????????? uid
  cardUid = 0;
  isMoreItem = false;

  // ?????? ??????
  timeVal: number;
  dateVal: number;

  GRID_STATE_KEY = 'admin_tranordmass';
  saveStateMain = this.gridUtil.fnGridSaveState(this.GRID_STATE_KEY + '_main');
  loadStateMain = this.gridUtil.fnGridLoadState(this.GRID_STATE_KEY + '_main');
  saveStatePopup = this.gridUtil.fnGridSaveState(this.GRID_STATE_KEY + '_popup');
  loadStatePopup = this.gridUtil.fnGridLoadState(this.GRID_STATE_KEY + '_popup');
  loadStateTag = this.gridUtil.fnGridLoadState(this.GRID_STATE_KEY + '_tag');
  saveStateTag = this.gridUtil.fnGridSaveState(this.GRID_STATE_KEY + '_tag');

  // ?????? ??????
  templateDataSource: DataSource;
  templateEntityStore: ArrayStore;

  /**
   * ?????? ????????? ????????????
   * dataField ?????? ??????????????? ??????.
   * */
  async headerMatch(mapData: {}): Promise<void> {
    for (const sheet of Object.keys(mapData)) {
      for (const row of Object.keys(mapData[sheet])) {
        // ?????? row ??? ????????? ??????
        for (const key of Object.keys(mapData[sheet][row])) {
          // key??? ??????
          for (const matchKey of Object.keys(COMMONINITDATA.EXCELHEADER)) {
            const str = this.utilService.convert(matchKey);
            if (String(key) === String(str)) {
              mapData[sheet][row][COMMONINITDATA.EXCELHEADER[matchKey]] = String(mapData[sheet][row][key]);
              delete mapData[sheet][row][key];
              break;
            }
          }
        }
      }
      break;
    }
  }

  // ?????????, ?????? ?????? ??? ??????
  checkTranOrdCompany(rowData: any): any {
    if (Boolean(String(rowData.tranOrdCompany).trim()) && Boolean(rowData.tranOrdCompany)) {
      Object.assign(rowData, {tranOrdType: 1});
    } else {
      Object.assign(rowData, {tranOrdCompany: '??????'});
      Object.assign(rowData, {tranOrdType: 0});
    }
    return rowData;
  }

  // ????????? ??????
  checkWayPoint(sheetData: Array<any>): any {
    let isWayPointExist = false;
    let ordNum = 1;
    let count = 0;
    let list = [];
    const sheetList = [];

    // tslint:disable-next-line:typedef no-shadowed-variable
    function setListToSheetList(list: any[]) {
      if (count > 2) {
        isWayPointExist = true;
      }
      for (const item of list) {
        item.isWayPointExist = isWayPointExist;
      }
      count = 0;
      isWayPointExist = false;
      return list;
    }

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (Number(row.tranOrdGroup) === ordNum) {
        count++;
        list.push(row);
        if (i === sheetData.length - 1) {
          list = setListToSheetList(list);
        }
      } else {
        list = setListToSheetList(list);
        ordNum = Number(row.tranOrdGroup);
      }
      if (count === 0) {
        sheetList.push(...list);
        count = 1;
        list = [];
        list.push(row);
      }
    }
    return sheetList;
  }

  // ????????? row ?????? ??????
  getCardUid(list: any[]): any {
    const tempList: number[] = [];
    for (const item of list) {
      tempList.push(Number(item.uid));
    }
    this.cardUid = Math.min(...tempList);
  }

  // ????????? ??????
  async addCardItem(e): Promise<void> {
    this.cardItems = await this.setSearchData();
    if (this.cardItems.length > 0) {
      for (const item of this.cardItems) {
        this.mainData.push(item);
      }
      console.log(e);
      // ????????? ?????????, ????????? ?????? ?????????...
      setTimeout(() => {
        const element = document.querySelector('.layout-body').getElementsByClassName('dx-scrollable-container')[0];
        element.scrollTo({left: 0, top: element.scrollHeight, behavior: 'smooth'});
      }, 1);
    }
  }

  async setSearchData(): Promise<any> {
    const searchVO = {
      sts: '101', // ????????????
      fromRcvSchDate: this.mainFormData.fromRcvSchDate,
      toRcvSchDate: this.mainFormData.toRcvSchDate,
      limitCnt: this.limitCnt,
      cardUid: null
    };
    if (Boolean(this.cardUid)) {
      searchVO.cardUid = this.cardUid;
    }
    const searchData = await this.tranOrdMassService.get(searchVO);
    if (searchData.data.length < this.limitCnt || !Boolean(searchData)) {
      this.isMoreItem = false;
    } else if (searchData.data.length === this.limitCnt) {
      this.isMoreItem = true;
    }
    this.getCardUid(searchData.data);
    const list = [];
    for (const item of searchData.data) {
      for (const detail of item.tranOrdMassDetailList) {
        const itemDetail = {};
        Object.assign(itemDetail, Object.assign(item, detail));
        list.push(itemDetail);
      }
    }
    return this.beforePrint(list);
  }

  // ?????? ???????????? ????????? ??????
  async dataValidation(rowData: object): Promise<{}> {
    /** 1. ????????? ????????? ?????? ????????? ??????
     * ?????? ??? ???????????? ?????? row??? valFlg??? false??? ??????.
     *     'tranOrdGroup', // ????????????
     *     'tranPointSeq', // ??????
     *     'tranType',         // ????????????
     *     'tranOrdDate1', // ????????????
     *     tranOrdDate2', // ????????????
     *     'companyNm', // ?????????
     *     'address1',  // ??????1
     *     address2',  // ??????2 (2022-11-04 ??????)
     *     'refNm',       // ?????????
     *     'refTellNo', // ?????????
     */
    let valList = [];
    // ?????? ?????????, ????????? 1????????? ?????? ??????
    // @ts-ignore
    if (Number(rowData.tranPointSeq) === 1) {
      valList = Object.values(COMMONINITDATA.EXCELHEADER);
      // 1. ?????????, ?????? ??????
      rowData = this.checkTranOrdCompany(rowData);
    } else {
      valList = ['tranOrdGroup', 'tranPointSeq', 'tranType', 'tranOrdDate1', 'tranOrdDate2',
        'companyNm', 'address1', 'refNm', 'refTellNo', 'remarks'];
    }

    // ????????? ??????
    let chkValue: any = false;
    let errorKey: any = '';
    for (const matchKey of valList) {
      if (typeof rowData[matchKey] === 'string') {
        rowData[matchKey] = String(rowData[matchKey]).trim();
      }
      chkValue = Boolean(rowData[matchKey]);
      if (!chkValue) {
        errorKey = matchKey;
        break;
      }
    }
    // ?????? ??????
    if (chkValue) {
      // @ts-ignore
      rowData.result = this.utilService.convert1('admin.tranordmass.validationsuccess', `?????? ??????`);
    } else {
      // @ts-ignore
      rowData.result = `${this.getMessageByValue(errorKey)} ${this.utilService.convert1('admin.tranordmass.validationfail', '?????? ??????')}`;
    }
    // @ts-ignore
    rowData.valFlg = Boolean(chkValue);
    return rowData;
  }

  // ????????? ????????????
  async wayPointValidation(rowData: any): Promise<{}> {
    /**
     * 1. ????????? ???????????? ?????? ??????????????? ????????? ?????? ?????? (tranIntervalType)
     * 2. ????????? ???????????? ?????? ??????????????? ????????? 1?????? ?????? ?????? ??? (tranCarCnt)
     * 3. ????????? ???????????? ?????? ????????? ??????????????? ?????? ?????? ?????? (tranIntervalType)
     * ???????????? 1 ??? ????????? ????????????.
     * */
    if (Number(rowData.tranPointSeq) === 1) {
      const condition = rowData.isWayPointExist;
      let errorKey: any = '';
      let chkValue: any = false;
      if (condition) {
        if (rowData.tranIntervalType !== '??????') {
          errorKey = 'tranIntervalType';
        } else if (Number(rowData.tranCarCnt) !== 1) {
          errorKey = 'tranCarCnt';
        }
        chkValue = Boolean(errorKey);
        if (chkValue) {
          rowData.result = `${this.getMessageByValue(errorKey)} ${this.utilService.convert1('admin.tranordmass.validationfail', '?????? ??????')}`;
          rowData.valFlg = false;
        }
      }
    }
    return rowData;
  }

  // ????????? ??? ????????????
  async dateTimeValidation(rowData: any): Promise<{}> {
    // ???????????? ??????
    const datePattern = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
    const date = String(rowData.tranOrdDate1).trim();
    if (!datePattern.test(date)) {
      rowData.tranOrdDate1 = this.fixDate(rowData.tranOrdDate1);
    }
    // ???????????? ??????
    const timePattern = /^([1-9]|[01][0-9]|2[0-3]):([0-5][0-9])$/;
    const time = String(rowData.tranOrdDate2).trim();
    if (!timePattern.test(time)) {
      rowData.tranOrdDate2 = this.fixTime(rowData.tranOrdDate2);
    }
    Object.assign(rowData, {tranDate: `${rowData.tranOrdDate1}`});
    Object.assign(rowData, {expectedDateTime: `${rowData.tranOrdDate1} ${rowData.tranOrdDate2}`});

    let chkDateValue = false;
    let errorKey = '';
    // ???????????? ??????
    const thisDate = Number(String(rowData.tranOrdDate1).replace(/\D/g, ''));
    // ????????? ???????????? ????????? ???.
    if (Number(rowData.tranPointSeq) === 1) {
      this.dateVal = thisDate;
      chkDateValue = true;
    } else {
      // ????????? ?????????????????? ??????
      if (this.dateVal <= thisDate) {
        this.dateVal = thisDate;
        chkDateValue = true;
      } else {
        errorKey = 'tranOrdDate1';
      }
    }
    let chkTimeValue = false;
    if (chkDateValue) {
      // ???????????? ??????
      const thisTime = Number(String(rowData.tranOrdDate2).replace(/\D/g, ''));
      // ????????? ???????????? ????????? ???.
      if (Number(rowData.tranPointSeq) === 1) {
        this.timeVal = thisTime;
        chkTimeValue = true;
      } else {
        // ????????? ?????????????????? ??????
        if (this.timeVal < thisTime) {
          this.timeVal = thisTime;
          chkTimeValue = true;
        } else {
          errorKey = 'tranOrdDate2';
        }
      }
    }
    const chkValue = chkDateValue && chkTimeValue;
    // ?????? ??????
    if (chkValue) {
      // @ts-ignore
      rowData.result = this.utilService.convert1('admin.tranordmass.validationsuccess', `?????? ??????`);
    } else {
      // @ts-ignore
      rowData.result = `${this.getMessageByValue(errorKey)} ${this.utilService.convert1('admin.tranordmass.validationfail', '?????? ??????')}`;
    }
    // @ts-ignore
    rowData.valFlg = chkValue;

    return rowData;
  }

  // ????????? ??? ????????????
  async addrValidation(rowData: any): Promise<{}> {
    /**
     * 2. valFlg??? true??? ??????
     *  (1) ???????????? ??????
     *  (2) ?????? ??????
     *  */
    if (rowData.valFlg) {
      let theAddr: string;
      // (1) ???????????? ??????
      if (Boolean(rowData.newRoadName)) {
        theAddr = rowData.newRoadName;
      } else {
        theAddr = `${String(rowData.address1).trim()}`;
      }

      let result: any;
      result = await this.tranOrdMassService.addressValidation(theAddr).then(res => result = res).catch(err => result = err);
      rowData.addressValFlg = false;
      if (Boolean(result.error)) {
        rowData.result = `????????? ????????? ????????????.`;
      } else if (Number(result.totalCount) > 1) {
        rowData.result = `????????? ????????? ?????? ????????????.`;
      } else if (Number(result.totalCount) === 1) {
        const addrInfo = result.coordinate[0];
        rowData.addressValFlg = true;
        // ???/??? | ???/??? | ???/??? ??????
        rowData.ciDo = addrInfo.city_do;
        rowData.guGun = addrInfo.gu_gun;
        rowData.eupMyun = addrInfo.eup_myun;
        rowData.latitude = addrInfo.lat;
        rowData.longitude = addrInfo.lon;

        /*
        * 2022.10.17 ?????? ?????????
        * */
        const addr1KeyList = ['city_do', 'gu_gun', 'eup_myun', 'legalDong', 'ri', 'bunji'];
        const addr2KeyList = ['buildingName', 'buildingDong'];
        const newRoadNameList = ['newRoadName', 'newBuildingIndex'];
        const addr1 = addr1KeyList.map((item) => {
          if (Boolean(addrInfo[item])) {
            return addrInfo[item];
          }
        });
        const addr2 = addr2KeyList.map((item) => {
          if (Boolean(addrInfo[item])) {
            return addrInfo[item];
          }
        });
        // ????????? ??????(Tmap?????? ???????????? ????????? ??????????????? ???????????? ??????.)
        const newRoadName = newRoadNameList.map((item) => {
          if (Boolean(addrInfo[item])) {
            return addrInfo[item];
          }
        });
        rowData.address1 = String(addr1.join(' ')).replace(/\s+/g, ' ').trim();
        rowData.address2 = String(addr2.join(' ')).replace(/\s+/g, ' ').trim();
        rowData.newRoadName = String(newRoadName.join(' ')).replace(/\s+/g, ' ').trim();
      }
    }
    return rowData;
  }

  // ????????? ??????
  async validationRule(rowData: any): Promise<{}> {
    // ?????? ???????????? ?????? valFlg
    rowData = await this.dataValidation(rowData);
    if (!rowData.valFlg) {
      return rowData;
    }
    // ???????????? ???????????? ?????? ?????? valFlg
    rowData = await this.wayPointValidation(rowData);
    if (!rowData.valFlg) {
      return rowData;
    }
    // ????????? ?????? ???????????? ?????? valFlg
    rowData = await this.dateTimeValidation(rowData);
    if (!rowData.valFlg) {
      return rowData;
    }
    // ?????? ?????? addressValFlg
    rowData = await this.addrValidation(rowData);
    if (!rowData.addressValFlg) {
      return rowData;
    }
    return rowData;
  }

  // ?????? ??????
  async excelDataValidation(mapData: object): Promise<any> {
    /**
     * ???????????? ????????? ??? ROW(???)??? ????????? ??? ???????????? ??????
     * */
    let num = 1;
    const sheetName = 'Sheet1';
    for (const sheet of Object.keys(mapData)) {
      if (sheet !== sheetName) {
        break;
      }
      let sheetData = mapData[sheet]; // array
      // ????????? ??????
      sheetData = this.checkWayPoint(sheetData);
      for (const row of Object.keys(sheetData)) {
        // ????????? ?????? ??????
        let rowData = sheetData[row];
        rowData.rowNum = num;
        num++;
        // rowData ??????
        rowData = await this.validationRule(rowData);
      }
    }
    /**
     * ??? ?????? ?????? valFlg ??? addrFlg??? ?????? true??? ?????????
     * (1) ?????? 1?????? ??? ??????????????? ?????? ????????????.
     * (2) ?????? valFlg, addressValFlg ?????? ??? ??????
     * */
      // ?????? 1??? ????????? obj
    let cloneObj = {
        valFlg: undefined,
        addressValFlg: false
      };
    for (const sheet of Object.keys(mapData)) {
      if (sheet !== sheetName) {
        break;
      }
      for (const row of Object.keys(mapData[sheet])) {
        const rowData = mapData[sheet][row];
        if (rowData.valFlg && rowData.addressValFlg && Number(rowData.tranPointSeq) === 1) {
          cloneObj = Object.assign(rowData);
        }
        if (cloneObj.valFlg && cloneObj.addressValFlg) {
          for (const cloneKey of Object.keys(cloneObj)) {
            if (String(cloneKey) !== 'tranOrdGroup' && String(cloneKey) !== 'tranPointSeq' &&
              String(cloneKey) !== 'tranType' && String(cloneKey) !== 'tranOrdDate1' &&
              String(cloneKey) !== 'tranOrdDate2' && String(cloneKey) !== 'companyNm' &&
              String(cloneKey) !== 'address1' && String(cloneKey) !== 'address2' &&
              String(cloneKey) !== 'refNm' && String(cloneKey) !== 'refTellNo' && String(cloneKey) !== 'remarks' &&
              String(cloneKey) !== 'valFlg' && String(cloneKey) !== 'addressValFlg') {
              if (!Boolean(rowData[cloneKey])) {
                Object.assign(rowData, {[cloneKey]: cloneObj[cloneKey]});
              }
            }
          }
        }
      }
    }
    return mapData;
  }

  getMessageByValue(value: string): string {
    return this.utilService.convert(this.getKeyByValue(value));
  }

  // Object?????? value??? key??? ??????
  getKeyByValue(value: string): string {
    const obj = COMMONINITDATA.EXCELHEADER;
    return Object.keys(obj).find(key => obj[key] === value);
  }

  // ????????? ??????????????? ????????? ?????? ???????????? ???????????? ??????
  fixTime(time: any): string {
    let hour: any = Number(time) * 24;
    let min: any = 0;

    if (hour % 1 > 0) {
      min = Math.round(hour % 1 * 60);
    }
    if (min < 10) {
      min = `0${min}`;
    }
    hour = Math.floor(hour);
    if (hour < 10) {
      hour = `0${hour}`;
    }
    return `${hour}:${min}`;
  }

  // ????????? 1900????????? ???????????? ???????????? ????????? ?????? ??????
  fixDate(date: any): string {
    const daysBeforeUnixEpoch = 70 * 365 + 19;
    const hour = 60 * 60 * 1000;
    const newDate = new Date(Math.round((date - daysBeforeUnixEpoch) * 24 * hour) + 12 * hour);

    return this.utilService.formatDate(newDate);
  }

  addComma(num: string): string {
    return num.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
  }

  async onTemplateFileUploader(fileUploader: DxFileUploaderComponent): Promise<void> {
    /*
          1. ???????????? ????????????
          2. ?????? ?????? ??????
          3. ???????????? ?????? ??????(TMAP) : ????????? 1?????? ???????????????. ???????????? ??????????????????.
          4. row??? ??????????????? ???????????? ????????? ?????? ????????? ??? ????????? flg??? flase ????????????.
          5. ?????? ????????? ????????? ?????? ???????????? ????????? ???????????? ??? ??? ????????? ??????.
          this.templateDataSource.items() + ??????flg
    */
    let workBook = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = fileUploader.value[0];
    if (!file) {
      return;
    }

    reader.onload = () => {
      const data = reader.result;
      workBook = XLSX.read(data, {type: 'binary'});
      jsonData = workBook.SheetNames.reduce((initial, name) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        return initial;
      }, {});
      const dataString = JSON.stringify(jsonData);
      const mapData = JSON.parse(dataString);
      // ????????? ????????? DB ???????????? ??????
      // this.headerMatch(mapData);
      this.headerMatch(mapData).then(() => this.excelDataValidation(mapData));

      this.templateEntityStore = new ArrayStore(
        {
          data: mapData.Sheet1,
          key: 'rowNum'
        }
      );

      this.templateDataSource = new DataSource({
        store: this.templateEntityStore
      });
    };

    reader.readAsBinaryString(file);

  }

  onResetFileUploader(fileUploader: DxFileUploaderComponent): void {
    this.templateEntityStore.clear();
    this.templateDataSource.reload();
    fileUploader.instance.reset();
    this.templateEntityStore = new ArrayStore(
      {data: [], key: 'rowNum'});
    this.templateDataSource = new DataSource({
      store: this.templateEntityStore
    });
  }

  onToolbarPreparingWithExtra(e): void {
    const toolbarItems = e.toolbarOptions.items;
    const newToolbarItems = [];

    newToolbarItems.push(toolbarItems.find(item => item.name === 'searchPanel'));
    newToolbarItems.push(toolbarItems.find(item => item.name === 'exportButton'));
    newToolbarItems.push(toolbarItems.find(item => item.name === 'columnChooserButton'));

    newToolbarItems.push({  // ??????????????????
      location: 'after',
      widget: 'dxButton',
      options: {
        icon: 'check',
        text: this.utilService.convert1('admin.tranordmass.templatedown', '??????????????????'),
        onClick: this.downloadExcel.bind(this)
      }
    });

    e.toolbarOptions.items = newToolbarItems;
  }

  async downloadExcel(): Promise<void> {
    this.tranOrdMassService.downloadTemplateExcel();
  }

  // ???????????? ?????????
  async onNew(e): Promise<void> {
    // this.onResetFileUploader(fileUploader);
    this.showPopup('Add', {...e.data});
  }

  async showPopup(popupMode, data): Promise<void> {

    this.templateEntityStore = new ArrayStore(
      {data: [], key: 'rowNum'});
    this.templateDataSource = new DataSource({
      store: this.templateEntityStore
    });
    this.fileUploader.instance.reset();

    this.popupFormData = data;
    this.popupFormData = {tenant: this.G_TENANT, ...this.popupFormData};
    this.popupMode = popupMode;
    this.popupVisible = true;
  }

  popupShown(e): void {

    this.popupForm.instance.focus();
    /*
        this.templateEntityStore = new ArrayStore(
          {data: [], key: 'rowNum'});
        this.templateDataSource = new DataSource({
          store: this.templateEntityStore
        });
        this.fileUploader.instance.reset();*/
  }

  // ????????? ?????????
  async onReset(): Promise<void> {
    await this.mainForm.instance.resetValues();
    await this.initForm();
    // ????????? ???????????? ?????????????????? ??????
    if (this.mainData.length > 0) {
      this.mainData = [];
    }
  }
  // ????????? ?????????
  async encodingData(data: any): Promise<any> {
    const theDateTime = String(`${data.expectedDateTime}:00`).trim();
    data.expectedDateTime = theDateTime;
    // ?????? ??????
    for (const type of this.dsCarType) {
      if (data.tranCarType === type.codeName) {
        data.tranCarType = type.code;
      }
    }
    // ?????? ??????
    for (const type of this.dsCarKind) {
      if (data.tranCarKind === type.codeName) {
        data.tranCarKind = type.code;
        data.codeCategoryId = type.codeCategoryId;
        data.codeId = type.codeId;
      }
    }
    // ??????????????????
    for (const type of this.dsItemOption) {
      if (data.tranItemOption === type.codeName) {
        data.tranItemOption = type.code;
      }
    }
    // ??????????????????
    for (const type of this.dsOrdCategory) {
      if (data.tranOrdCategory === type.codeName) {
        data.tranOrdCategory = type.code;
      }
    }
    // ????????????
    for (const type of this.dsTranSalesType) {
      if (data.tranSalesType === type.codeName) {
        data.tranSalesType = type.code;
      }
    }
    // ????????????
    for (const type of this.dsIntervalType) {
      if (data.tranIntervalType === type.codeName) {
        data.tranIntervalType = type.code;
      }
    }
    // ?????????
    for (const type of this.dsCompanyList) {
      if (data.tranOrdCompany === type.name) {
        data.companyId = type.uid;
      }
    }
    for (const key of Object.keys(data)) {
      if (String(data[key]).includes(',')) {
        data[key] = Number(String(data[key]).replace(/,/g, ''));
      }
    }
    return data;
  }

  beforePrint(data: any): any {
    /**
     * ?????? ???????????? ????????? OBJECT??? ???????????????.
     * ?????????,?????????,??????????????? ?????????.
     * */
    let sumData = {
      upData: {},
      downData: {},
      viaNum: 0
    };
    const arrData = [];

    for (const item of data) {
      // lookup??? ???????????? ????????? ?????? ???????????????. dataField = tranOrdCompany
      // ?????? ??????
      for (const type of this.dsCarType) {
        if (item.tranCarType === type.code) {
          item.tranCarType = type.codeName;
        }
      }
      // ?????? ??????
      for (const type of this.dsCarKind) {
        if (item.tranCarKind === type.code) {
          item.tranCarKind = type.codeName;
        }
      }
      // ??????????????????
      for (const type of this.dsItemOption) {
        if (item.tranItemOption === type.code) {
          item.tranItemOption = type.codeName;
        }
      }
      // ??????????????????
      for (const type of this.dsOrdCategory) {
        if (item.tranOrdCategory === type.code) {
          item.tranOrdCategory = type.codeName;
        }
      }
      // ????????????
      for (const type of this.dsTranSalesType) {
        if (item.tranSalesType === type.code) {
          item.tranSalesType = type.codeName;
        }
      }
      // ????????????
      for (const type of this.dsIntervalType) {
        if (item.tranIntervalType === type.code) {
          item.tranIntervalType = type.codeName;
        }
      }
      // ?????????
      if (Number(item.tranOrdType) === 0) {
        item.tranOrdCompany = '??????';
      } else {
        for (const type of this.dsCompanyList) {
          if (item.companyId === type.uid) {
            item.tranOrdCompany = type.name;
          }
        }
      }
      // ??????1,2 ?????????
      const theAddr = `${String(item.address1).trim()}`;/*${String(item.address2).trim()}*/
      Object.assign(item, {addrFull: theAddr});
      // ????????? ?????? tranItemCbm tranItemWeight tranItemAmt tranCarCnt
      item.tranCarCnt = this.addComma(String(item.tranCarCnt));
      item.tranItemCbm = this.addComma(String(item.tranItemCbm));
      item.tranItemWeight = this.addComma(String(item.tranItemWeight));
      item.tranItemAmt = this.addComma(String(item.tranItemAmt));
      item.tranTotAmt = this.addComma(String(item.tranTotAmt));

      if (item.tranPointType === 'S') {
        item.trantype = '??????';
        sumData.upData = item;
        // ??????, ?????? ??????
        item.tranOrdTime = String(item.expectedDateTime).substring(String(item.tranData).length + 1, item.expectedDateTime.length - 3);

      } else if (item.tranPointType === 'W') {
        sumData.viaNum++;
      } else if (item.tranPointType === 'E') {
        item.trantype = '??????';
        sumData.downData = item;
      }
      // ?????????
      if (Object.keys(sumData.upData).length > 0 && Object.keys(sumData.downData).length > 0) {
        arrData.push(sumData);
        sumData = {
          upData: {},
          downData: {},
          viaNum: 0
        };
      }
    }
    return arrData;
  }

  // ???????????? ?????????
  async popupSaveClick(e): Promise<void> {
    /*
    1. ???????????? ????????????
    2. ?????? ?????? ??????
    3. ???????????? ?????? ??????(TMAP) : ????????? 1?????? ???????????????. ???????????? ??????????????????.
    4. row??? ??????????????? ???????????? ????????? ?????? ????????? ??? ????????? flg??? flase ????????????.
    5. ?????? ????????? ????????? ?????? ???????????? ????????? ???????????? ??? ??? ????????? ??????.
    this.templateDataSource.items() + ??????flg
    */
    if (!this.utilService.isAdminUser()) {
      await this.tranOrdMassService.confirm(this.utilService.convert1('admin.tranordmass.addrvalidationfail', '???????????? ?????? ???????????????.'));
    }
    let rowData = this.templateDataSource.items();
    // ?????? ??? ????????? ??????
    let isAddrVale = true;
    let isVal = true;

    for (const item of rowData) {
      // ????????? ?????? ??????
      if (!item.valFlg) {
        isVal = item.valFlg;
        await this.tranOrdMassService.confirm(this.utilService.convert1('admin.tranordmass.datavalidationfail', '????????? ?????? ??????'));
        break;
      }
      // ?????? ?????? ??????
      else if (!item.addressValFlg) {
        isAddrVale = item.addressValFlg;
        await this.tranOrdMassService.confirm(this.utilService.convert1('admin.tranordmass.addrvalidationfail', '?????? ?????? ??????'));
        break;
      }

    }
    if (isAddrVale && isVal) {
      if (
        !await this.utilService.confirm(this.utilService.convert('com.confirm.save', '????????????'))) {
        return;
      }

      for (let row of rowData) {
        row = this.encodingData(row);
      }
      /**
       * estimatedTime : ??????????????????
       * estimatedDistance : ??????????????????
       * tollFare : ???????????? ??????
       * */
      this.loadPanel.visible = true;
      rowData = await this.setEstimateData(rowData);
      this.loadPanel.visible = false;

      const result = await this.tranOrdMassService.save(rowData);
      this.popupVisible = false;
      this.resultMsgCallback(result, 'Adjust');
      await this.onSearch();
    }
  }

  async setEstimateData(rowData: any): Promise<any> {
    let reqCar: number;
    const resultList = [];
    let routObj: any = {};

    for (const item of rowData) {
      routObj.pass = [];
      if (item.tranType === '??????') {
        routObj.startX = item.longitude;
        routObj.startY = item.latitude;
      } else if (item.tranType === '??????') {
        routObj.pass.push(`${item.longitude},${item.latitude}`);
      } else if (item.tranType === '??????') {
        routObj.endX = item.longitude;
        routObj.endY = item.latitude;
        reqCar = Number(item.tranCarKind);
      }
      if (Boolean(routObj.startX) && Boolean(routObj.endX)) {
        routObj.passList = routObj.pass.join('_');
        // ?????? API ????????? ?????? ?????? ??????
        for (const car of this.dsCarKind) {
          if (reqCar === Number(car.code)) {
            routObj.truckWidth = Number(car.etcColumn2) / 10;
            routObj.truckHeight = Number(car.etcColumn3) / 10;
            routObj.truckLength = Number(car.etcColumn1) / 10;
            routObj.truckWeight = Number(car.etcColumn4) * 1000;
            routObj.truckTotalWeight = Number(car.etcColumn4) * 1000;

            const prtcl = await this.tranOrdMassService.getAddrDataByCoordinate(routObj);
            if (prtcl.hasOwnProperty('features')) {
              const result: any = {};
              result.tranOrdGroup = item.tranOrdGroup;
              result.estimatedDistance = prtcl.features[0].properties.totalDistance;
              result.estimatedTime = prtcl.features[0].properties.totalTime;
              result.tollFare = prtcl.features[0].properties.totalFare;
              // ????????? ?????? ??? ??????????????? x2??? ?????????.
              if (Number(item.tranIntervalType) === 1){
                result.estimatedDistance = Number(result.estimatedDistance) * 2;
                result.estimatedTime = Number(result.estimatedTime) * 2;
                result.tollFare = Number(result.tollFare) * 2;
              }
              resultList.push(result);
            }
            routObj = {};
            break;
          }
        }
      }
    }
    for (const item of rowData) {
      if (item.tranType === '??????') {
        for (const est of resultList) {
          if (est.tranOrdGroup === item.tranOrdGroup) {
            item.estimatedDistance = est.estimatedDistance;
            item.estimatedTime = est.estimatedTime / 60;
            item.tollFare = est.tollFare;
          }
        }
      }
    }
    return rowData;
  }

  async onSearch(): Promise<any> {
    try {
      this.mainData = await this.setSearchData();
      this.utilService.notify_success('search success');
    } catch {
      this.utilService.notify_error('search error');
    }
  }

  async popupReCheck(e): Promise<void> {

    const mapData = {
      Sheet1: this.templateDataSource.items()
    };
    const changedDataSource = await this.excelDataValidation(mapData);

    this.templateEntityStore = new ArrayStore(
      {data: changedDataSource.Sheet1, key: 'rowNum'});
    // this.popupGrid.instance.option('dataSource', changedDataSource);
    // await this.templateDataSource.reload();
  }

  // ?????????????????? ???????????? ??????
  async onMainRegist(e): Promise<void> {

    try {
      // const registData = await this.onSearch();
      let registData: any[];
      registData = this.mainData;
      if (registData.length > 0) {
        if (
          !await this.utilService.confirm(this.utilService.convert('com.confirm.execute', '???????????? ??????'))) {
          return;
        }
        // uid??? ??????
        const list = [];
        for (const item of registData) {
          const obj = {uid: null};
          obj.uid = item.upData.uid;
          list.push(obj);
        }
        await this.tranOrdMassService.regist(list);

        this.utilService.notify_success('regist success');
      } else {
        await this.tranOrdMassService.confirm(this.utilService.convert1('admin.tranordmass.registempty', '????????? ??????????????? ????????????.'));
      }

    } catch {
      this.utilService.notify_error('regist error');

    }
    await this.onSearch();
  }

  // ?????????????????? ???????????? ?????? -> ??????
  async onMainDelete(uid): Promise<void> {

    try {
      if (
        !await this.utilService.confirm(this.utilService.convert('com.confirm.delete', '????????????'))) {
        return;
      }
      const result = await this.tranOrdMassService.delete(uid);
      if (!result.success) {
        this.utilService.notify_error(result.msg);
        return;
      } else {
        this.utilService.notify_success('Delete success');
        this.popupForm.instance.resetValues();
        this.popupVisible = false;
        await this.onSearch();
      }
    } catch {
      this.utilService.notify_error('There was an error!');
    }
  }

  resultMsgCallback(result, msg): boolean {

    if (result.success) {
      this.utilService.notify_success(msg + ' success');
    } else {
      this.utilService.notify_error(result.msg);
    }
    return result.success;
  }

// ???????????? ?????????
  popupCancelClick(e): void {
    this.popupVisible = false;
    this.popupForm.instance.resetValues();
  }

  setFocusRow(index, grid): void {
    grid.focusedRowIndex = index;
  }

  // ????????? ??? ????????? ???????????? ??????
  onFocusedCellChanging(e, grid): void {
    this.setFocusRow(e.rowIndex, grid);
  }

  // ????????? ??????
  creatFileName(menuName: string): string {
    const today: Date = new Date();
    let thisMonth: any = today.getMonth() + 1;
    let thisDay: any = today.getDate();
    let thisHour: any = today.getHours();
    let thisMin: any = today.getMinutes();
    if (Number(thisMonth) < 10) {
      thisMonth = `0${thisMonth}`;
    }
    if (Number(thisDay) < 10) {
      thisDay = `0${thisDay}`;
    }
    if (Number(thisHour) < 10) {
      thisHour = `0${thisHour}`;
    }
    if (Number(thisMin) < 10) {
      thisMin = `0${thisMin}`;
    }
    return `${menuName}_${today.getFullYear()}${thisMonth}${thisDay}${thisHour}${thisMin}`;
  }

  // ?????? ??? ???????????? ???????????? ?????? row??? ????????? ????????????.
  onCellPrepared(e): string {
    if (e.rowType === 'header') {
      return;
    }
    if (!e.data.valFlg || !e.data.addressValFlg) {
      e.cellElement.style.color = 'red';
    }
    if (e.data.valFlg && e.data.addressValFlg) {
      e.cellElement.style.color = 'black';
    }
  }

  ngOnInit(): void {
    this.mainEntityStore = new ArrayStore(
      {
        data: [],
        key: this.key
      }
    );
    this.mainDataSource = new DataSource({
      store: this.mainEntityStore
    });

    this.G_TENANT = this.utilService.getTenant();
    this.initCode();
  }

  ngAfterViewInit(): void {

    const rangeDate = this.utilService.getDateRange();
    this.mainForm.instance.getEditor('fromRcvSchDate').option('value', rangeDate.fromDate);
    this.mainForm.instance.getEditor('toRcvSchDate').option('value', rangeDate.toDate);
    this.utilService.getShowBookMark(
      {tenant: this.G_TENANT, userId: this.utilService.getUserUid(), menuL2Id: this.pageInfo.menuL2Id}, this.bookmarkBtn
    ).then(() => this.onSearch());
    // this.onSearch().then();
  }

  initCode(): void {
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'CARTYPE').subscribe(result => {
      this.dsCarType = result.data;
    });
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'CARKIND').subscribe(result => {
      this.dsCarKind = result.data;
    });
    // ??????????????????
    this.codeService.getCode(this.G_TENANT, 'TRANITEMOPTION').subscribe(result => {
      this.dsItemOption = result.data;
    });
    // ??????????????????
    this.codeService.getCode(this.G_TENANT, 'TRANORDCATEGORY').subscribe(result => {
      this.dsOrdCategory = result.data;
    });
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'TRANITEMPACKTYPE').subscribe(result => {
      this.dsItemPackType = result.data;
    });
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'TRANSALESTYPE').subscribe(result => {
      this.dsTranSalesType = result.data;
    });
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'TRANINTERVALTYPE').subscribe(result => {
      this.dsIntervalType = result.data;
    });
    // ?????????
    const searchCompanyVO = {
      tenant: this.G_TENANT,
      actFlg: 'Y'
    };
    this.companyService.sendPost(searchCompanyVO, 'findCompany').then((result) => {
      this.dsCompanyList = result.data;
    });
  }

  initForm(): void {

  }
}
