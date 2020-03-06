import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from 'budgetkey-ng2-auth';
import { Router } from '@angular/router';
import { RolesService } from './roles.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public pipelines = new BehaviorSubject<any[]>([]);
  public users = new BehaviorSubject<any[]>([]);
  public configuration = new ReplaySubject(1);

  public currentConfig: any = null;
  private options = {};

  API_ENDPOINT = '//localhost:5000/api';

  private token_ = new ReplaySubject<string>(1);
  private providers_: any = null;
  private authenticated_ = false;
  private authorized_ = false;

  constructor(private http: HttpClient, private auth: AuthService, private router: Router, private roles: RolesService) {
      this.auth.check(window.location.href)
        .subscribe((authInfo) => {
          console.log('authInfo', authInfo);
          if (authInfo) {
            this.providers_ = authInfo.providers;
            this.authenticated_ = authInfo.authenticated;
            if (!this.authenticated_) {
              console.log('navigate');
              this.router.navigate(['/'], {queryParams: {next: window.location.pathname}});
            }
          }
        });
      this.auth.getJwt()
          .subscribe((token) => {
            console.log('GOT JWT', token);
            if (token) {
              this.auth.permission('etl-server')
                .subscribe((permission: any) => {
                  this.authorized_ = permission.permissions && permission.permissions.level;
                  if (this.authorized_) {
                    this.token_.next(permission.token);
                    this.roles.setRoles(permission.permissions.roles || []);
                  } else {
                    console.log('navigate');
                    this.router.navigate(['/']);
                  }
                });
            }
          });
      this.token_.subscribe((token) => {
        if (token) {
          this.getConfiguration();
          this.queryPipelines();
        }
        this.options = {headers: {'X-Auth': token}}; });
  }

  get providers() {
    return this.providers_;
  }

  get token() {
    return this.token_;
  }

  get httpOptions(): any {
    return this.options;
  }

  createMap(obj, field, target) {
    const ret = {};
    for (const item of obj[field]) {
      ret[item.name] = item;
    }
    obj[target] = ret;
  }

  getConfiguration() {
    this.token_.pipe(
      switchMap((token) => this.http.get(`${this.API_ENDPOINT}/configuration?jwt=${token}`, this.options))
    ).subscribe((result) => {
        const configuration = result['result'];
        this.createMap(configuration, 'kinds', 'kinds_map');
        this.createMap(configuration, 'schedules', 'schedules_map');
        this.configuration.next(configuration);
        this.currentConfig = configuration;
      });
  }

  queryUsers() {
    this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/users`, this.options)),
      map((result: any) => {
        if (result.success) {
          return (<any[]>result['result']).map((x) => Object.assign(x.value, {self: x.self}));
        }
        return [];
      })
    ).subscribe((users) => {
      console.log('USERS', users);
      this.users.next(users);
    });
  }

  deleteUser(userId) {
    return this.http.delete(`${this.API_ENDPOINT}/user/${userId}`, this.options)
            .pipe(
              map((result) => {
                this.queryUsers();
                return result;
              })
            );
  }

  updateUser(user) {
    return this.http.post(`${this.API_ENDPOINT}/user`, user, this.options)
            .pipe(
              map((result) => {
                this.queryUsers();
                return result;
              })
            );
  }

  queryPipelines() {
    this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/pipelines`, this.options)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return [];
      })
    ).subscribe((pipelines) => {
      console.log('pipelines', pipelines);
      for (const x of pipelines) {
        x['params'] = x['params'] || {};
        x['status'] = x['status'] || {};
      }
      this.pipelines.next(pipelines);
    });
  }

  queryPipeline(id: string) {
    return this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/pipeline/${id}`, this.options)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return {};
      })
    );
  }

  savePipeline(pipeline: any) {
    return this.http.post(`${this.API_ENDPOINT}/pipeline`, pipeline, this.options)
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
            return result['result'];
          }
          return {};
        })
      );
  }

  deletePipeline(id: any) {
    return this.http.delete(`${this.API_ENDPOINT}/pipeline/${id}`, this.options)
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
          }
          return result.success;
        })
      );
  }

  triggerPipeline(id: any) {
    return this.http.post(`${this.API_ENDPOINT}/pipeline/start/${id}`, {}, this.options)
      .pipe(
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
          }
          return result.success;
        })
      );
  }


}
