import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashobardComponent } from './dashobard/dashobard.component';
import { DashboardErrorsComponent } from './dashboard-errors/dashboard-errors.component';
import { ErrorsInfoComponent } from './errors-info/errors-info.component';
import { ErrorBoxesComponent } from './error-boxes/error-boxes.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'dashobard-normal/:pattern', component: DashobardComponent },
  {
    path: 'dashobard-errors/:pattern/:id',
    component: DashboardErrorsComponent,
  },
  { path: 'errors/:id', component: DashboardErrorsComponent },
  { path: 'errors-info/:id', component: ErrorsInfoComponent },
  { path: 'error-boxes/:id', component: ErrorBoxesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
