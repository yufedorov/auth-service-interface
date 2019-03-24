import { } from 'jasmine';
import http = require("http");
//import * as assert from 'assert';
//import { expect } from 'chai';
import * as chai from 'chai';
//import * as chaiHttp from 'chai-http';
import { } from 'mocha';
import * as supertest from 'supertest'
//let expect=chai.expect;
//chai.use(chaiHttp)
import {app,httpServer,passportConfig} from '@yufedorov/authentication-service/dist/app-base';
import{ mongoUnitStart,mongoUnitStop,instanceInternalService,instanceExternalService} from '@yufedorov/auth-mongo-unit';
import {AuthServiceInterface} from "../src";
let authServer=httpServer;
let internalServer = instanceInternalService;
let externalServer = instanceExternalService;
let request = supertest.agent(authServer);
let intServiceJwt='';
let extServiceJwt='';
let user1InternalJwt='';
let user1ExternalJwt='';
let user2InternalJwt='';
let authServInterface=new AuthServiceInterface('localhost',3030)

describe("ModelEnvironment", function () {
    after(function () {
        console.log('\n-------After all-------');
        authServer.close();
        internalServer.close();
        externalServer.close();
        mongoUnitStop().subscribe(()=>{
            console.log('\n-------Mongo Unit Stopped-------');
            process.exit();//только так удалось стопнуть тест
        });
    });
    this.timeout(60000);
    before((done) => {
        console.log('-------Before all-------')
        mongoUnitStart().filter((done) => done).take(1).subscribe((flag)=>{
            passportConfig.GetHostAddresses().subscribe(()=>{
                authServer.listen(3030)
                done()
            });
        })
    })

    it('/api/auth/login - не тот system', (done) => {
        console.log('-------Begin test-------\n')
        authServInterface.login(
            'meteor',
            'username1',
            'password1').subscribe((res)=>{
                if(res=='fail')done();
        })
    });

    it('/api/auth/login - Логинимся не в ту систему', (done) => {
        authServInterface.login(
            'meteor',
            'int_user',
            'int_user').subscribe((res)=>{
            if(res=='fail')done();
        })
    });

    it('/api/auth/login - Логинимся через int_user в TestExternalService', (done) => {
        authServInterface.login(
            'TEST_EXTERNAL_SERVICE',
            'int_user',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/login - Логинимся через int_user в InternalService', (done) => {
        authServInterface.login(
            'INTERNAL_SERVICE',
            'int_user',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/login - Логинимся через int_user в TestExternalService ещё раз', (done) => {
        authServInterface.login(
            'TEST_EXTERNAL_SERVICE',
            'int_user',
            'int_user').subscribe((res)=>{
            if(res=='already login')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем int_user в InternalService', (done) => {
        authServInterface.isSessionValid(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем int_user в TestExternalService', (done) => {
        authServInterface.isSessionValid(
            'TEST_EXTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем не того юзера в TestExternalService', (done) => {
        authServInterface.isSessionValid(
            'TEST_EXTERNAL_SERVICE',
            'int_user1').subscribe((res)=>{
            if(res=='fail')done();
        })
    });

    it('/api/auth/logout - Выходим int_user из TestExternalService', (done) => {
        authServInterface.logout(
            'TEST_EXTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем int_user в TestExternalService, что его нет', (done) => {
        authServInterface.isSessionValid(
            'TEST_EXTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='fail')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем int_user в InternalService, что он остался', (done) => {
        authServInterface.isSessionValid(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/logout - Выходим int_user из TestExternalService снова', (done) => {
        authServInterface.logout(
            'TEST_EXTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='fail')done();
        })
    });

    it('/api/auth/logout - Выходим int_user из InternalService', (done) => {
        authServInterface.logout(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/logout - Выходим int_user из InternalService снова', (done) => {
        authServInterface.logout(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='fail')done();
        })
    });

    it('/api/auth/login - Логинимся через int_user в InternalService обратно', (done) => {
        authServInterface.login(
            'INTERNAL_SERVICE',
            'int_user',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/isSessionValid - Проверяем int_user в InternalService', (done) => {
        authServInterface.isSessionValid(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });

    it('/api/auth/logout - Выходим int_user из InternalService', (done) => {
        authServInterface.logout(
            'INTERNAL_SERVICE',
            'int_user').subscribe((res)=>{
            if(res=='success')done();
        })
    });
})