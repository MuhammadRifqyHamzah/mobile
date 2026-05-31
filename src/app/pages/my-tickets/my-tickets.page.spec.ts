import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyTicketsPage } from './my-tickets.page';

describe('MyTicketsPage', () => {
  let component: MyTicketsPage;
  let fixture: ComponentFixture<MyTicketsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyTicketsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
