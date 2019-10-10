import { BrowserModule } from "@angular/platform-browser";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { AppComponent } from "./app.component";
import { WriterComponent } from './text/writer/writer.component';
import {FormsModule} from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { NewfileComponent } from './newfile/newfile.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatAutocompleteModule,
  MatCardModule, MatDialogModule,
  MatDividerModule,
  MatFormFieldModule,
  MatGridListModule, MatIconModule, MatInputModule,
  MatSidenavModule,
  MatToolbarModule, MatTooltipModule
} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    WriterComponent,
    LoginComponent,
    NewfileComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    NoopAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    MatSidenavModule,
    MatDividerModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  entryComponents: [
      NewfileComponent
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [ NO_ERRORS_SCHEMA ]
})
export class AppModule { }
