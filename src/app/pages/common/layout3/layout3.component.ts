

import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {DxFormComponent} from 'devextreme-angular/ui/form';
import {DxButtonComponent, DxDataGridComponent, DxPopupComponent} from 'devextreme-angular';
import {CommonUtilService} from '../../../shared/services/common-util.service';
import {CompanySearchVO, Layout3Service} from './layout3.service';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import {CommonCodeService} from '../../../shared/services/common-code.service';
import {GridUtilService} from '../../../shared/services/grid-util.service';
import _ from 'lodash';


@Component({
  selector: 'app-layout3',
  templateUrl: './layout3.component.html',
  styleUrls: ['./layout3.component.scss']
})
export class Layout3Component implements OnInit {

  constructor(
    public utilService: CommonUtilService,
    private service: Layout3Service,
    private codeService: CommonCodeService,
    public gridUtil: GridUtilService,
  ) {
    this.G_TENANT = this.utilService.getTenant();
    this.getFilteredLocId = this.getFilteredLocId.bind(this);
    this.onChangedCountry = this.onChangedCountry.bind(this);
    this.initMap = this.initMap.bind(this);
    this.isAllowEditing = this.isAllowEditing.bind(this);
    this.addClick = this.addClick.bind(this);
    this.deleteClick = this.deleteClick.bind(this);
    this.comfirmAddress = this.comfirmAddress.bind(this);
  }
  @ViewChild('bookmarkBtn', {static: false}) bookmarkBtn: DxButtonComponent;
  @ViewChild('mainForm', {static: false}) mainForm: DxFormComponent;
  @ViewChild('mainGrid', {static: false}) mainGrid: DxDataGridComponent;

  @ViewChild('popup', {static: false}) popup: DxPopupComponent;
  @ViewChild('popupGrid', {static: false}) popupGrid: DxDataGridComponent;
  @ViewChild('popupForm', {static: false}) popupForm: DxFormComponent;

  @ViewChild('newBtn', {static: false}) newBtn: DxButtonComponent;
  @ViewChild('deleteBtn', {static: false}) deleteBtn: DxButtonComponent;
  @ViewChild('saveBtn', {static: false}) saveBtn: DxButtonComponent;
  @ViewChild('foldableBtn', {static: false}) foldableBtn: DxButtonComponent;

  // Global
  G_TENANT: any;
  dsUser = [];

  // ***** main ***** //
  // Form
  mainFormData = {};
  // Grid
  mainGridDataSource: DataSource;
  mainEntityStore: ArrayStore;
  key = 'uid';
  // ***** main ***** //

  // ***** popup ***** //
  popupVisible = false;
  popupMode = 'Add';
  // Form
  popupFormData: any;

  popupDataSource: DataSource;
  popupEntityStore: ArrayStore;
  selectedRows: number[];
  deleteRowList = [];
  changes = [];
  // ***** popup ***** //

  // DataSets
  dsActFlg = [];
  dsWarehouse = [];
  dsCountry = [];
  dsWarehouseId = [];
  dsUrcvingLocId = [];
  dsBadReturnLocId = [];
  dsCancelLocId = [];
  dsSortLocId = [];
  dsLocId = [];

  searchAddress = {
    getPacComp: () => {
      return document.getElementsByClassName('pac-container pac-logo');
    },
    initPacComp: () => {
      const pacComp = this.searchAddress.getPacComp();
      for (let i = 0; i < pacComp.length; i++) {
        if (pacComp.item(i)) {
          pacComp.item(i).remove();
        }
      }
    },
    showPacComp: () => {
      const pacComp = this.searchAddress.getPacComp();
      if (pacComp.length > 0) {
        const s = pacComp.item(0).getAttribute('style');
        const zIndexStr = ' z-index: 9999;';
        pacComp.item(0).setAttribute('style', s.replace(new RegExp(zIndexStr, 'g'), ''));
        pacComp.item(0).setAttribute('style', pacComp.item(0).getAttribute('style') + zIndexStr);
      }
    },
    hidePacComp: () => {
      const pacComp = this.searchAddress.getPacComp();
      if (pacComp.length > 0) {
        const s = pacComp.item(0).getAttribute('style');
        const zIndexStr = ' z-index: -1;';
        pacComp.item(0).setAttribute('style', s.replace(new RegExp(zIndexStr, 'g'), ''));
        pacComp.item(0).setAttribute('style', pacComp.item(0).getAttribute('style') + zIndexStr);
      }
    },
    getInputComp: () => {
      return document.getElementsByName('address1AutoComplete').item(0) as HTMLInputElement;
    },
    resetInput: () => {
      this.searchAddress.getInputComp().value = '';
    },
    setInputValue: (value: string) => {
      this.searchAddress.getInputComp().value = value;
    },
    getInputValue: () => {
      return this.searchAddress.getInputComp().value;
    }
  };

  autocomplegetInputCompte: any = null;
  options = {
    componentRestrictions: {country: ''},
    fields: ['address_components', 'geometry', 'name'],
    strictBounds: false,
    types: ['geocode', 'establishment']
  };

  // Grid State
  GRID_STATE_KEY = 'mm_company1';
  saveStateMain = this.gridUtil.fnGridSaveState(this.GRID_STATE_KEY + '_main');
  loadStateMain = this.gridUtil.fnGridLoadState(this.GRID_STATE_KEY + '_main');
  saveStatePopup = this.gridUtil.fnGridSaveState(this.GRID_STATE_KEY + '_popup');
  loadStatePopup = this.gridUtil.fnGridLoadState(this.GRID_STATE_KEY + '_popup');

  phonePattern: any = /^[0-9|\+|\)|-]+$/;

  phoneChangeFlg = false;

  // ?????? ?????? ??? ??? ??????
  ngOnInit(): void {
    this.G_TENANT = this.utilService.getTenant();
    this.initCode();

    this.mainEntityStore = new ArrayStore(
      {
        data: [],
        key: this.key
      }
    );

    this.mainGridDataSource = new DataSource({
      store: this.mainEntityStore
    });
  }

  // ????????? ??????????????? ??? ?????? ??? ??????
  ngAfterViewInit(): void {
    this.searchAddress.initPacComp();

    this.utilService.getFoldable(this.mainForm, this.foldableBtn);
    this.initForm();
    this.utilService.getGridHeight(this.mainGrid);

    // ????????? ????????? ?????? ?????? ?????? ?????????
    this.newBtn.visible = this.utilService.isAdminUser();
    this.bookmarkBtn.instance.option('icon', 'star');
  }

  initCode(): void {
    // ????????????
    this.codeService.getCode(this.G_TENANT, 'YN').subscribe(result => {
      this.dsActFlg = result.data;
    });

    // ??????
    // this.codeService.getWarehouse(this.G_TENANT, null, null).subscribe(result => {
    //   // this.codeService.getCommonWarehouse(Number(this.utilService.getUserUid())).subscribe(result => {
    //   this.dsWarehouseId = result.data;
    // });

    // ??????
    // this.codeService.getCodeOrderByCode(this.G_TENANT, 'COUNTRY').subscribe(result => {
    //   this.dsCountry = result.data;
    // });

    // ????????????????????????
    // this.codeService.getLocation(this.G_TENANT, null).subscribe(result => {
    //   this.dsLocId = result.data;
    // });

    // ?????????
    this.codeService.getUser(this.G_TENANT).subscribe(result => {
      this.dsUser = result.data;
    });
  }

  async onSearch(): Promise<void> {
    const data = this.mainForm.instance.validate();

    if (data.isValid) {
      const searchData = _.cloneDeep(this.mainFormData) as CompanySearchVO;

      searchData.isCarrier = this.mainForm.instance.getEditor('isCarrier').option('value') === true ? 1 : 0;
      searchData.isCustomer = this.mainForm.instance.getEditor('isCustomer').option('value') === true ? 1 : 0;
      searchData.isEtc = this.mainForm.instance.getEditor('isEtc').option('value') === true ? 1 : 0;
      searchData.isOwner = this.mainForm.instance.getEditor('isOwner').option('value') === true ? 1 : 0;
      searchData.isShipTo = this.mainForm.instance.getEditor('isShipTo').option('value') === true ? 1 : 0;
      searchData.isSupplier = this.mainForm.instance.getEditor('isSupplier').option('value') === true ? 1 : 0;
      searchData.isWarehouse = this.mainForm.instance.getEditor('isWarehouse').option('value') === true ? 1 : 0;

      const result = await this.service.get(searchData);

      if (this.resultMsgCallback(result, 'Search')) {
        this.mainEntityStore = new ArrayStore(
          {
            data: result.data,
            key: this.key
          }
        );

        this.mainGridDataSource = new DataSource({
          store: this.mainEntityStore
        });
        this.mainGrid.focusedRowKey = null;
        this.mainGrid.paging.pageIndex = 0;
      } else {
        return;
      }
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

  // ??????
  async onNew(e): Promise<void> {
    // ????????? ????????? ?????? ?????? ?????? ??????
    if (!this.utilService.isAdminUser()) {
      this.utilService.notify_error('?????? ?????? ????????? ????????????.');
      return;
    }

    this.deleteBtn.visible = false;
    this.showPopup('Add', {...e.data});
  }

  // ??????
  async onSearchPopup(): Promise<void> {
    if (this.popupFormData.uid) {
      // Service??? get ?????? ??????
      const result = await this.service.getPopup(this.popupFormData);

      if (!result.success) {
        this.utilService.notify_error(result.msg);
        return;
      } else {

        this.popupGrid.instance.cancelEditData();
        this.utilService.notify_success('search success');
        this.popupEntityStore = new ArrayStore(
          {
            data: result.data.warehouseList,
            key: this.key
          }
        );
        this.popupDataSource = new DataSource({
          store: this.popupEntityStore
        });
        this.popupGrid.focusedRowKey = null;
        this.popupGrid.paging.pageIndex = 0;
      }
    }
  }

  // Popup ??????
  showPopup(popupMode, data): void {
    this.changes = [];  // ?????????
    this.popupEntityStore = new ArrayStore(
      {
        data: [],
        key: this.key
      }
    );

    this.popupDataSource = new DataSource({
      store: this.popupEntityStore
    });

    this.popupFormData = data;
    this.popupFormData = {tenant: this.G_TENANT, ...this.popupFormData};

    this.popupMode = popupMode;
    this.popupVisible = true;

    this.onSearchPopup();
  }

  async popupSaveClick(e): Promise<void> {

    // if (this.changes.length === 0) {
    //   this.utilService.notify_error('????????? ???????????????.');
    //   return;
    // }

    // const columns = ['ownerId', 'itemAdminId'];    // required ?????? dataField ??????
    const popData = this.popupForm.instance.validate();
    if (popData.isValid) {
      try {
        let result;
        this.popupFormData.address1 = this.searchAddress.getInputValue();

        const saveContent = this.popupFormData as any;
        const detailList = this.collectGridData(this.changes);

        const addList = this.popupDataSource.items();

        const saveList = [];
        detailList.forEach(el => {
          const filtered = addList.filter(ee => ee.uid === el.uid);

          if (filtered.length > 0) {
            filtered[0].operType = el.operType;
            // ????????? ?????? ????????? ??????
            filtered[0].warehouseId = el.warehouseId ? el.warehouseId : filtered[0].warehouseId;
            filtered[0].uRcvIngLocId = el.uRcvIngLocId ? el.uRcvIngLocId : filtered[0].uRcvIngLocId;
            filtered[0].urcvIngLocId = el.urcvIngLocId ? el.urcvIngLocId : filtered[0].urcvIngLocId;
            filtered[0].badReturnLocId = el.badReturnLocId ? el.badReturnLocId : filtered[0].badReturnLocId;
            filtered[0].cancelLocId = el.cancelLocId ? el.cancelLocId : filtered[0].cancelLocId;
            filtered[0].sortLocId = el.sortLocId ? el.sortLocId : filtered[0].sortLocId;

            filtered[0].produceLocId = el.produceLocId ? el.produceLocId : filtered[0].produceLocId;
            filtered[0].finishedLocId = el.finishedLocId ? el.finishedLocId : filtered[0].finishedLocId;

            filtered[0].remarks = el.remarks ? el.remarks : filtered[0].remarks;

            saveList.push(filtered[0]);
          } else {
            saveList.push(el);
          }
        });

        // ???????????? ??? ?????????
        saveContent.isCarrier = this.popupFormData.isCarrier === true ? 1 : 0;
        saveContent.isCustomer = this.popupFormData.isCustomer === true ? 1 : 0;
        saveContent.isEtc = this.popupFormData.isEtc === true ? 1 : 0;
        saveContent.isOwner = this.popupFormData.isOwner === true ? 1 : 0;
        saveContent.isShipTo = this.popupFormData.isShipTo === true ? 1 : 0;
        saveContent.isSupplier = this.popupFormData.isSupplier === true ? 1 : 0;
        saveContent.isWarehouse = this.popupFormData.isWarehouse === true ? 1 : 0;


        saveContent.ownerId = this.utilService.getCommonOwnerId();
        saveContent.warehouseList = saveList;

        if (this.popupMode === 'Add') {
          result = await this.service.save(saveContent);
        } else {
          result = await this.service.update(saveContent);
        }
        if (!result.success) {
          this.utilService.notify_error(result.msg);
          return;
        } else {
          this.utilService.notify_success('Save success');
          this.popupForm.instance.resetValues();
          this.popupVisible = false;
          this.onSearch();
        }
      } catch {
        this.utilService.notify_error('There was an error!');
      }
    }
  }

  // ????????? ??????????????? ???????????? ??????
  rowDblClick(e): void {
    this.deleteBtn.visible = this.utilService.isAdminUser();
    this.saveBtn.visible = this.utilService.isAdminUser();

    // Row double ????????? ??????????????? ?????? Row??? ?????? ???????????? ????????? ??? ??????.
    this.showPopup('Edit', {...e.data});
  }

  // ????????? ??? ????????? ???????????? ??????
  onFocusedCellChanging(e, grid): void {
    this.setFocusRow(e.rowIndex, grid);
  }

  setFocusRow(index, grid): void {
    grid.focusedRowIndex = index;
  }

  addClick(): void {
    if (this.utilService.isAdminUser() || this.popupMode === 'Add') {
      this.popupGrid.instance.addRow().then(r => this.setFocusRow(0, this.popupGrid));
    }
  }

  async deleteClick(): Promise<void> {
    if (this.utilService.isAdminUser() || this.popupMode === 'Add') {
      if (this.popupGrid.focusedRowIndex > -1) {
        this.popupGrid.instance.deleteRow(this.popupGrid.focusedRowIndex);
        this.popupEntityStore.push([{type: 'remove', key: this.popupGrid.focusedRowKey}]);
      }
    }
  }

  async onReset(): Promise<void> {
    await this.mainForm.instance.resetValues();
    await this.initForm();
  }

  initForm(): void {
    this.mainForm.instance.getEditor('actFlg').option('value', 'Y');
    this.mainForm.instance.focus();
  }

  collectGridData(changes: any): any[] {
    const gridList = [];

    // tslint:disable-next-line:forin
    for (const rowIndex in changes) {
      // Insert??? ?????? UUID??? ????????? ?????? ????????? Null??? ????????????.
      if (changes[rowIndex].type === 'insert') {
        gridList.push(Object.assign({
          operType: changes[rowIndex].type,
          uid: null,
          tenant: this.G_TENANT
        }, changes[rowIndex].data));
      } else if (changes[rowIndex].type === 'remove') {
        gridList.push(
          Object.assign(
            {operType: changes[rowIndex].type, uid: changes[rowIndex].key}, changes[rowIndex].data)
        );
      } else {
        gridList.push(
          Object.assign(
            {operType: changes[rowIndex].type, uid: changes[rowIndex].key}, changes[rowIndex].data
          )
        );
      }
    }

    return gridList;
  }

  // ?????? ??????
  async onPopupOpen(e): Promise<void> {
    this.popup.visible = true;
    this.phoneChangeFlg = false;
    if (e.element.id === 'Open') {
      this.deleteBtn.visible = false;
      this.popupMode = 'Add';
      this.onPopupInitData();
    } else {
      await this.initMap();
      this.deleteBtn.visible = this.utilService.isAdminUser();
      this.saveBtn.visible = this.utilService.isAdminUser();
      this.popupMode = 'Edit';
      this.onPopupSearch(e.data).then(
        (r) => {
          this.popupForm.instance.getEditor('name').focus();
        }
      );
    }
  }

  // ????????? ???????????????
  onPopupInitData(): void {
    // this.popupFormData = Object.assign({tenant: this.G_TENANT, company: '', name: '', shortName: '', actFlg: 'Y'});
  }

  async onPopupAfterOpen(): Promise<void> {

    // ????????? ????????? ?????? ?????? ????????????
    const isDisabled = this.utilService.isAdminUser();
    for (const group of this.popupForm.items) {
      if (group.hasOwnProperty('items')) {
        // @ts-ignore
        for (const i of group.items) {
          if (i.hasOwnProperty('dataField')) {
            try {
              this.popupForm.instance.getEditor(i.dataField).option('disabled', !isDisabled && this.popupMode !== 'Add');
            } catch {
            }
          }
        }
      }
    }

    this.searchAddress.hidePacComp();

    if (this.popupMode === 'Add') {
      this.popupForm.instance.getEditor('actFlg').option('value', 'Y');
      this.popupForm.instance.getEditor('company').focus();
      // await this.initMap();
    } else {
      await this.changedCountry(this.popupFormData.countrycd);
      this.searchAddress.setInputValue(this.popupFormData.address1);
    }
  }

  isAllowEditing(): boolean {
    return this.utilService.isAdminUser() || this.popupMode === 'Add';
  }

  // ?????? ??????
  onPopupClose(): void {
    this.popup.visible = false;
  }

  onPopupAfterClose(): void {
    this.popupForm.instance.resetValues();
    this.popupForm.instance.getEditor('company').option('disabled', false);

    if (!!this.popupDataSource) {
      this.popupEntityStore.clear();
      this.popupDataSource.reload();
      this.popupGrid.instance.cancelEditData();
    }
    this.onSearch();
  }

  async onPopupSearch(data): Promise<void> {
    const result = await this.service.getPopup(data);

    if (this.resultMsgCallback(result, 'PopupSearch')) {
      this.popupFormData = result.data;
      this.popupForm.instance.getEditor('company').option('disabled', true);

      this.popupEntityStore = new ArrayStore(
        {
          data: result.data.warehouseList,
          key: this.key
        }
      );

      this.popupDataSource = new DataSource({
        store: this.popupEntityStore
      });
      this.popupGrid.focusedRowKey = null;
      this.popupGrid.paging.pageIndex = 0;
    } else {
      return;
    }
  }

  async onPopupDelete(): Promise<void> {

    try {
      this.popupFormData.isCarrier = this.popupFormData.isCarrier === true ? 1 : 0;
      this.popupFormData.isCustomer = this.popupFormData.isCustomer === true ? 1 : 0;
      this.popupFormData.isEtc = this.popupFormData.isEtc === true ? 1 : 0;
      this.popupFormData.isOwner = this.popupFormData.isOwner === true ? 1 : 0;
      this.popupFormData.isShipTo = this.popupFormData.isShipTo === true ? 1 : 0;
      this.popupFormData.isSupplier = this.popupFormData.isSupplier === true ? 1 : 0;
      this.popupFormData.isWarehouse = this.popupFormData.isWarehouse === true ? 1 : 0;

      const result = await this.service.delete(this.popupFormData);

      if (this.resultMsgCallback(result, 'Delete')) {
        this.onPopupClose();
      }
    } catch {
      this.utilService.notify_error('There was an error!');
    }
  }

  // ????????? Lookup filter
  getFilteredLocId(options): any {
    return {
      store: this.dsLocId,
      filter: options.data ? ['warehouseId', '=', options.data.warehouseId] : null
    };
  }

  // ??????????????? ???????????? ?????????
  setWarehouseValue(rowData: any, value: any): void {
    rowData.warehouseId = value;
    rowData.urcvIngLocId = null;
    rowData.badReturnLocId = null;
    rowData.cancelLocId = null;
    rowData.sortLocId = null;
  }

  onChangedCountry(e): void {
    this.changedCountry(e.value);

    if (this.phoneChangeFlg) {
      const findCode = this.dsCountry.find(el => el.code === this.popupFormData.countrycd);
      if (findCode) {
        this.popupForm.instance.getEditor('phone1').option('value', '+' + findCode.etcColumn1 + ')');
      }
    }

    this.phoneChangeFlg = true;
  }

  async changedCountry(country: string): Promise<void> {
    this.searchAddress.resetInput();  // ?????? ?????????

    this.popupFormData.zip = '';  // ????????????
    this.popupFormData.gps_lat = '';  // ??????
    this.popupFormData.gps_long = ''; // ??????

    // // ????????? ?????? ????????? ?????? API??????
    // if (country === 'KR') {
    //   // ?????? API ?????????
    //   this.autocomplete = null;
    //   this.searchAddress.initPacComp();
    //   this.searchAddress.getInputComp().removeEventListener('change', this.searchAddress.resetInput);
    // } else {
    //   await this.initMap();
    //
    //   if (this.autocomplete) {
    //     if (country) {
    //       this.autocomplete.setComponentRestrictions({country});
    //     } else {
    //       this.autocomplete.setOptions(this.options);
    //     }
    //   }
    //
    //   this.searchAddress.showPacComp();
    // }
  }

  async initMap(): Promise<void> {
    // const input = this.searchAddress.getInputComp();
    //
    // if (!this.autocomplete) {
    //   this.autocomplete = await new google.maps.places.Autocomplete(input, this.options);
    //   this.autocomplete.addListener('place_changed', () => {
    //     const place = this.autocomplete.getPlace();
    //     if (!place.geometry || !place.geometry.location || !this.popupFormData.countrycd) {
    //       this.searchAddress.resetInput();
    //     }
    //
    //     const geo = place.geometry;
    //     // ??????
    //     this.popupFormData.gps_lat = geo.location.lat();
    //     this.popupFormData.gps_long = geo.location.lng();
    //
    //     for (const addr of place.address_components) {
    //       if (addr.types.indexOf('postal_code') !== -1) {
    //         this.popupFormData.zip = addr.long_name;
    //       }
    //     }
    //   });
    //
    //   input.addEventListener('change', this.searchAddress.resetInput);
    // }
  }

  openMapLine(): void {
    window.open('https://www.geoplaner.com/', '_blank');
  }

  comfirmAddress(): void {
    const addr = this.searchAddress.getInputValue();

    if (this.popupFormData.countrycd === 'KR') {

      // @ts-ignore
      naver.maps.Service.geocode({
        query: addr
      }, (status, response) => {

        // @ts-ignore
        if (status !== naver.maps.Service.Status.OK) {
          this.utilService.notify_error(this.utilService.convert1('??????????????? ???????????? ????????????.', '??????????????? ???????????? ????????????.'));
          return;
        }

        const result = response.v2; // ?????? ????????? ????????????
        const items = result.addresses; // ?????? ????????? ??????

        if (items.length === 1) {

          let zipCode = '';
          for (const addrElement of items[0].addressElements) {
            if (addrElement.types.includes('POSTAL_CODE')) {
              zipCode = addrElement.longName;
            }
          }

          if (!zipCode) {
            this.utilService.notify_error(this.utilService.convert1('????????? ????????? ???????????????.', '????????? ????????? ???????????????.'));
            return;
          }

          this.searchAddress.setInputValue(items[0].roadAddress);  // ?????? ??????
          this.popupFormData.engAddress1 = items[0].englishAddress;  // ????????????
          this.popupFormData.zip = zipCode;
          this.popupFormData.gps_lat = items[0].x;
          this.popupFormData.gps_long = items[0].y;
        } else {
          this.utilService.notify_error(this.utilService.convert1('??????????????? ???????????? ????????????.', '??????????????? ???????????? ????????????.'));
          return;
        }
      });
    } else {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({
        address: addr,
      }, (results, status) => {
        if (status === 'OK') {
          if (results.length === 1) {

            let zipCode = '';
            for (const addrElement of results[0].address_components) {
              if (addrElement.types.includes('postal_code')) {
                zipCode = addrElement.long_name;
              }
            }

            if (!zipCode) {
              this.utilService.notify_error(this.utilService.convert1('????????? ????????? ???????????????.', '????????? ????????? ???????????????.'));
              return;
            }

            this.searchAddress.setInputValue(results[0].formatted_address);  // ?????? ??????
            this.popupFormData.engAddress1 = results[0].formatted_address;  // ????????????
            this.popupFormData.zip = zipCode; // ????????????
            this.popupFormData.gps_lat = results[0].geometry.location.lat();
            this.popupFormData.gps_long = results[0].geometry.location.lng();

          } else {
            this.utilService.notify_error(this.utilService.convert1('??????????????? ???????????? ????????????.', '??????????????? ???????????? ????????????.'));
            return;
          }
        } else {
          this.utilService.notify_error(this.utilService.convert1('??????????????? ???????????? ????????????.', '??????????????? ???????????? ????????????.'));
          return;
        }
      });
    }
  }

}
