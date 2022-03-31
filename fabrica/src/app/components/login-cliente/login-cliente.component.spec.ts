import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginClienteComponent } from './login-cliente.component';

describe('LoginComponent', () => {
  let component: LoginClienteComponent;
  let fixture: ComponentFixture<LoginClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginClienteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
