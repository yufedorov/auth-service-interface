import http = require("http");
import {BehaviorSubject, Observable} from 'rxjs'
import * as Messages from "./messages";


export class AuthServiceInterface{

    private arrayAuthentication:AuthParams[]=[];

    currentHost:string;
    currentPort:number;

    constructor(host?,port?){
        this.currentHost=host;
        this.currentPort=port;
    }

    setAddress(host: string, port: number) {
        this.currentHost = host
        this.currentPort = port
    }

    login(system:string,username:string,password:string):Observable<string>{
        let processLogin = Observable.create((o) => {
            let flagExist = false;
            this.arrayAuthentication.forEach((el)=>{
                if(el.system == system && el.username == username)flagExist=true;
            })
            if(flagExist){
                o.next("already login");
                o.complete();
            }else{
                this.login$(username,password,system).subscribe((res) => {
                    if(!!res['jwt']) {
                        let objToken: string=res['jwt'];
                        this.arrayAuthentication.push({system,username,password,objToken});
                        o.next("success")
                    }
                    else o.next("fail")
                    o.complete();
                },(err)=>{
                    o.next("fail"); o.complete();})
            }

        }).
        publishReplay(1);
        processLogin.connect();
        return processLogin.refCount()
    }
    isSessionValid(system:String,username:String):Observable<string>{
        let processSessionValid = Observable.create((o) => {
            let indexArray = [];
            let objToken: string;
            this.arrayAuthentication.forEach((el, i) => {
                if (el.system == system && el.username == username) {
                    indexArray.push(i);
                    objToken=el.objToken;
                }
            })
            this.isSessionValid$(objToken).subscribe((res) => {
                if(res['status']=='valid') {
                    o.next("success")
                }
                else {
                    indexArray.forEach(i => delete this.arrayAuthentication[i])
                    o.next("fail")
                }
                o.complete();

            },(err)=>{
                indexArray.forEach(i => delete this.arrayAuthentication[i])
                o.next("fail");
                o.complete();
            })
        }).
        publishReplay(1);
        processSessionValid.connect();
        return processSessionValid.refCount()
    }
    logout(system:String,username:String):Observable<string>{
        let processLogout = Observable.create((o) => {
            let indexArray = [];
            let objToken: string;
            this.arrayAuthentication.forEach((el, i) => {
                if (el.system == system && el.username == username) {
                    indexArray.push(i);
                    objToken=el.objToken;
                }
            })
            this.logout$(objToken).subscribe((res) => {
                if(res['status']=='success') {
                    indexArray.forEach(i => delete this.arrayAuthentication[i])
                    o.next("success")
                }
                else o.next("fail")
                o.complete();

            },(err)=>{o.next("fail"); o.complete();})
        }).
            publishReplay(1);
        processLogout.connect();
        return processLogout.refCount()
    }


    private AuthServiceRequest$(requestData: ObjectRequestData): Observable<Object> {
        return Observable.create((observer) => {
            let options = {
                "method": requestData.method,
                "hostname": requestData.host,
                "port": requestData.port,
                "path": requestData.path,
                "headers": {
                    "Content-Type": "application/json"
                }
            };
            if (!!requestData.objectToken) Object.assign(options.headers, {"Authorization": `Bearer ${requestData.objectToken}`})
            let req = http.request(options, (res) => {
                let chunks = [];

                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                res.on("error", (error) => {
                    observer.error(error);
                    observer.complete();
                });
                res.on("end", () => {
                    var body = Buffer.concat(chunks);
                    let result
                    try {
                        if (body.toString().startsWith('Internal Server Error')) observer.error("INVALID_TOKEN")
                        else {
                            result = JSON.parse(body.toString())
                            /*if (!!result.userprofiles&&isArray(result.userprofiles)&&result.userprofiles.length==1) {
                                console.log("emit",result.userprofiles)
                               observer.next(result.userprofiles[0])
                            }
                            else
                               observer.error("INVALID_USER_PROFILE")

                            }*/
                            observer.next(result);
                        }
                    } catch (error) {
                        observer.error(Messages.errorInvalidJson)
                    }
                    observer.complete();
                });
            });
            if (!!requestData.data) req.write(JSON.stringify(requestData.data));

            req.end();
        })
    }

    login$=(username: string, password: string, system: string): Observable<Object>=> {
        return this.AuthServiceRequest$({
            method: 'POST',
            host: this.currentHost,
            port: this.currentPort,
            path: "/api/auth/login",
            data: {username: username, password: password, system: system}
        })
            .concatMap((loginResult: any) => {
                if (!!loginResult.jwt) {
                    return Observable.of(loginResult)
                }
                else {

                    if (!!loginResult.error && (loginResult.error == 403 || loginResult.error == 'not-found')) {
                        return Observable.throw(Messages.errorWrongLoginCredentials)
                    }
                    else {
                        return Observable.throw(Messages.errorUnexpectedLoginError)
                    }
                }
            })
    }

    isSessionValid$=(token): Observable<Object>=> {
        return this.AuthServiceRequest$({
            method: 'POST',
            host: this.currentHost,
            port: this.currentPort,
            path: "/api/auth/isSessionValid",
            data: {jwt:token}
        })
            .concatMap((intServiceLoginResult: any) => {
                if (!!intServiceLoginResult.status) {
                    return Observable.of(intServiceLoginResult)
                }
                else {
                    if (!!intServiceLoginResult.error && (intServiceLoginResult.error == 403 || intServiceLoginResult.error == 'not-found')) {
                        return Observable.throw(Messages.errorWrongLoginCredentials)
                    }
                    else {
                        return Observable.throw(Messages.errorUnexpectedValidationError)
                    }
                }
            })
    }

    logout$=(token): Observable<Object>=> {
        return this.AuthServiceRequest$({
            method: 'POST',
            host: this.currentHost,
            port: this.currentPort,
            path: "/api/auth/logout",
            data: {jwt: token}
        })
            .concatMap((intServiceLoginResult: any) => {
                if (!!intServiceLoginResult.logout) {
                    return Observable.of(intServiceLoginResult.logout)
                }
                else {
                    if (!!intServiceLoginResult.error && (intServiceLoginResult.error == 403 || intServiceLoginResult.error == 'not-found')) {
                        return Observable.throw(Messages.errorWrongLoginCredentials)
                    }
                    else {
                        return Observable.throw(Messages.errorUnexpectedValidationError)
                    }
                }
            })
    }
}
type AuthParams = {
    system:string;
    username:string;
    password:string;
    objToken:string;
}

type ObjectRequestData = {
    method: string, host: string, port: number, path: string, objectToken?: string, data?: Object
}
