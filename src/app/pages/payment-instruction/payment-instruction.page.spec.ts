import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentInstructionPage } from './payment-instruction.page';

describe('PaymentInstructionPage', () => {
  let component: PaymentInstructionPage;
  let fixture: ComponentFixture<PaymentInstructionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentInstructionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
