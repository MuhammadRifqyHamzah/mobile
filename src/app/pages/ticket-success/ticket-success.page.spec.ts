import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketSuccessPage } from './ticket-success.page';

describe('TicketSuccessPage', () => {
  let component: TicketSuccessPage;
  let fixture: ComponentFixture<TicketSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
