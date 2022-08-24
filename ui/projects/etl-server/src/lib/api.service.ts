import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, ReplaySubject, of, from } from 'rxjs';
import { map, switchMap, catchError, filter, delay } from 'rxjs/operators';
import { AuthService } from 'dgp-oauth2-ng';
import { Router } from '@angular/router';
import { RolesService } from './roles.service';
import { Title } from '@angular/platform-browser';
import { ENVIRONMENT } from './config';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public pipelines = new ReplaySubject<any[]>(1);
  public users = new BehaviorSubject<any[]>([]);
  public files = new ReplaySubject<any[]>(1);
  public ownFiles = new ReplaySubject<any[]>(1);
  public otherFiles = new ReplaySubject<any[]>(1);
  public configuration = new ReplaySubject<any>(1);
  public taxonomies = new ReplaySubject<any>(1);
  public currentUserProfile = new ReplaySubject<any>(1);

  public currentConfig: any = null;
  private options: any = {};

  API_ENDPOINT = '';

  private token_ = new ReplaySubject<string>(1);
  private providers_: any = null;
  private authenticated_ = false;
  private authorized_ = false;
  private authError_ = false;
  private finishedFlow_ = false;
  private currentUser_ = null;

  constructor(private http: HttpClient, private auth: AuthService, private router: Router,
              private roles: RolesService, private title: Title, 
              @Inject(ENVIRONMENT) private environment) {
      this.API_ENDPOINT = this.environment.api_endpoint;
      this.auth.configure({
        authServerUrl: this.environment.auth_endpoint,
        jwtLocalStorageKey: 'jwt',
        jwtQueryParam: 'jwt',
        profilePagePath: '/p/'
      });
      this.auth.check(window.location.href).pipe(
        catchError((err, obs) => {
          this.authError_ = true;
          this.finishedFlow_ = true;
          return from([]);
        }),
      ).subscribe((authInfo) => {
          if (authInfo) {
            this.providers_ = authInfo.providers;
            this.authenticated_ = authInfo.authenticated;
            if (!this.authenticated_) {
              this.finishedFlow_ = true;
              this.router.navigate(['/'], {queryParams: {next: window.location.pathname}});
            } else {
              this.currentUser_ = authInfo;
            }
          }
        });
      this.auth.getJwt()
          .subscribe((token) => {
            if (token) {
              this.auth.permission('etl-server')
                .subscribe((permission: any) => {
                  this.authorized_ = permission.permissions && permission.permissions.level;
                  this.finishedFlow_ = true;
                  this.currentUserProfile.next({profile: this.currentUser_, permissions: permission.permissions});
                  if (this.authorized_) {
                    this.token_.next(permission.token);
                    this.roles.setRoles(permission.permissions.roles || []);
                  } else {
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

  get authenticated() {
    return this.authenticated_;
  }

  get authorized() {
    return this.authenticated_ && this.authorized_;
  }

  get currentUser() {
    return this.currentUser_;
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

  get finishedFlow() {
    return this.finishedFlow_;
  }

  get authError() {
    return this.authError_;
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
        if (configuration.siteTitle) {
          this.title.setTitle(configuration.siteTitle);
        }
        configuration.features = configuration.features || {};
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
      this.users.next(users);
    });
  }

  queryTaxonomies() {
    this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/taxonomies`, this.options)),
      map((result: any) => {
        if (result.success) {
          return (<any[]>result['result']).map((x) => Object.assign(x.value));
        }
        return [];
      })
    ).subscribe((taxonomies) => {
      this.taxonomies.next(taxonomies);
    });
  }

  updateTaxonomy(user) {
    return this.http.post(`${this.API_ENDPOINT}/taxonomy`, user, this.options);
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

  triggerPipelines(kind: string | null, successfulOnly: boolean) {
    const params = {};
    if (kind) { params['kind'] = kind; }
    if (!successfulOnly) { params['all'] = 'true'; }
    return this.http.post(`${this.API_ENDPOINT}/pipelines/start`, {},  Object.assign({params}, this.options))
      .pipe(
        delay(1000),
        map((result: any) => {
          if (result.success) {
            this.queryPipelines();
          }
          return result.success;
        })
      );
  }

  queryFiles(subscribe = true) {
    const o = this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/files`, this.options)),
      map((result: any) => {
        if (result.success) {
          return result.result;
        }
        return [];
      }),
      map((files) => {
        this.files.next(files);
        this.ownFiles.next(files.filter((x) => x.owner_id === this.currentUser_.profile.id));
        this.otherFiles.next(files.filter((x) => x.owner_id !== this.currentUser_.profile.id));
        return files;
      })
    );
    if (subscribe) {
      o.subscribe((files) => {
        console.log('FILES:', files);
      });
    }
    return o;
  }

  uploadFile(
    file: File, filename: string,
    progress, success
  ) {
    this.configuration.pipe(
      switchMap(() => {
        return this.http.post(`${this.API_ENDPOINT}/upload`, file, Object.assign({
          observe: 'events',
          reportProgress: true,
          params: {
            filename: filename
          }
        }, this.options));
      }),
      catchError((err) => {
        success(false);
        return of([err]);
      }),
      map((event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          progress(percentDone);
        } else {
          return event;
        }
      }),
      filter((event: any) => event && (!event.type || event.type === HttpEventType.Response))
    ).subscribe((result) => {
      if (result.body) {
        success(result.body.success);
        this.queryFiles();
      }
    });
  }

  deleteFile(filename) {
    return this.http.delete(`${this.API_ENDPOINT}/file`, Object.assign({
              params: {
                filename: filename
              }
           }, this.options))
            .pipe(
              map((result) => {
                this.queryFiles();
                return result;
              })
            );
  }


  queryDatarecords(kind) {
    return this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/datarecords/${kind}`, this.options)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return [];
      })
    );
  }

  queryDatarecord(kind, id) {
    return this.configuration.pipe(
      switchMap(() => this.http.get(`${this.API_ENDPOINT}/datarecord/${kind}/${id}`, this.options)),
      map((result: any) => {
        if (result.success) {
          return result['result'];
        }
        return {};
      })
    );
  }

  saveDatarecord(kind, datarecord) {
    return this.http.post(`${this.API_ENDPOINT}/datarecord/${kind}`, datarecord, this.options)
      .pipe(
        map((result: any) => {
          if (result.success) {
            return result['result'];
          }
          return {};
        })
      );
  }

  deleteDatarecord(kind, id: any) {
    return this.http.delete(`${this.API_ENDPOINT}/datarecord/${kind}/${id}`, this.options)
      .pipe(
        switchMap(() => {
          return this.queryDatarecords(kind);
        })
      );
  }

}
