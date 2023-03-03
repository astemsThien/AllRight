


import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {
  DxButtonComponent,
  DxMapComponent
} from 'devextreme-angular';
import { Layout5Service } from '../../common/layout5/layout5.service';

@Component({
  selector: 'app-astems04',
  templateUrl: './astems04.component.html',
  styleUrls: ['./astems04.component.scss']
})
export class Astems04Component implements OnInit {
  @ViewChild('bookmarkBtn', {static: false}) bookmarkBtn: DxButtonComponent;
  @ViewChild('sMap', {static: false}) sMap: DxMapComponent;
  @ViewChild('bookmarkToggleBtn', {static: false}) bookmarkToggleBtn: DxButtonComponent;
  
  isBookmakExpanded = false;


  // mainFormData = {};


  ngOnInit(): void {
    //document.body.addEventListener('click',(e) => console.log(e.target))
    //document.body.addEventListener('mousewheel',(e) => console.log(e.target) )
   
   
  }



  initMap(): void {
    this.sMap.apiKey = {google: 'AIzaSyDI3ChJAmSoajg3HmNQNvIoViojmg7HOTo'};
    // this.sMap.center = '37.482489, 126.878240';
    this.sMap.zoom = 17;
    this.sMap.height = 'calc( 100vh - 75px ) ';
    this.sMap.width = '100%';

    this.sMap.markers = 
    [{
      location: [37.14662571373519, 127.5939137276295],
      // tooltip: {
      //   isShown: true,
      //   text:'test'
      // },
    }];
  }
  ngAfterViewInit(): void {
    this.bookmarkBtn.instance.option('icon', 'star');
    this.bookmarkToggleBtn.instance.option('icon', 'chevrondown');
    this.initMap();

  }

  onBookmarkAdjust(): void {

    if (this.isBookmakExpanded ) {
      this.isBookmakExpanded = false ;
      this.bookmarkToggleBtn.instance.option('icon', 'chevrondown');

    } else{
      this.isBookmakExpanded = true ;
      this.bookmarkToggleBtn.instance.option('icon', 'chevronup');
      
    }
  }


}












