import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PatternComponent } from './modals/pattern/pattern.component';
import { DashobardComponent } from './dashobard/dashobard.component';
import { DashboardErrorsComponent } from './dashboard-errors/dashboard-errors.component';
import { ErrorsInfoComponent } from './errors-info/errors-info.component';
import { ErrorBoxesComponent } from './error-boxes/error-boxes.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [AppComponent, SideNavComponent, PatternComponent, DashobardComponent, DashboardErrorsComponent, ErrorsInfoComponent, ErrorBoxesComponent, HomeComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
