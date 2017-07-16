import * as express from 'express';
import {IWebServerConfig, startServer} from 'express-web-server';
import * as bodyParser from "body-parser";
import noCache = require('no-cache-express');
import * as prettyPrinter from 'express-pretty-print';
import * as fs from 'fs';
import * as path from 'path';
import {IAppConfig} from './app-config';
import * as events from "events";
import * as srvMgr from "./server-mgr";
import * as sm from "./state-machine";
import {Router as msgRouter, ConnectionsManager} from "./msg";
import * as messenger from "./api-server-messenger";
import {IGlobal} from "./global";
import {Router as servicesRouter} from "./services";
import * as proxy from "express-http-proxy";
import * as msgtx from "./msg-transaction";

let configFile: string = null;

if (process.argv.length < 3)
    configFile = path.join(__dirname, "../../configs/local-testing-config.json");
else
    configFile = process.argv[2];

let config: IAppConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));

let appMsg = express();
appMsg.set('jsonp callback name', 'cb');
appMsg.use(noCache);
appMsg.use(bodyParser.json({"limit":"999mb"}));
appMsg.use(prettyPrinter.get());

appMsg.use('/msg', msgRouter);

startServer(config.msgServerConfig, appMsg, (secure:boolean, host:string, port:number) => {
    let protocol = (secure ? 'https' : 'http');
    console.log(new Date().toISOString() + ': api gateway <MSG> server listening at %s://%s:%s', protocol, host, port);
}, (err:any) => {
    console.error(new Date().toISOString() + ': !!! api gateway <MSG> server error: ' + JSON.stringify(err));
    process.exit(1);
});

let apiServerMessenger = messenger.get(ConnectionsManager);
let apiServerMsgTransaction = msgtx.get(apiServerMessenger, {timeoutMS: 15000});
let serverManager = srvMgr.get(config.availableApiServerPorts, config.msgServerConfig.http.port, config.NODE_PATH, apiServerMessenger);
let stateMachine = sm.get(serverManager);

stateMachine.on("ready", () => {    // api server is ready => get the proxy ready
    console.log(new Date().toISOString() + ': state machine reports a <ready> state. starting the api proxy server...');
    let appProxy = express();
    let targetAcquisition = (req: express.Request) => Promise.resolve<proxy.TargetSettings>({targetUrl: stateMachine.TargetInstanceUrl + "/services"});
    appProxy.use("/services", proxy.get({targetAcquisition}));

    startServer(config.proxyServerConfig, appProxy, (secure:boolean, host:string, port:number) => {
        let protocol = (secure ? 'https' : 'http');
        console.log(new Date().toISOString() + ': api gateway <PROXY> server listening at %s://%s:%s', protocol, host, port);
    }, (err:any) => {
        console.error(new Date().toISOString() + ': !!! api gateway <PROXY> server error: ' + JSON.stringify(err));
        process.exit(1);
    });
}).on("change", () => {
    console.log(new Date().toISOString() + ": <<change>> state=" + stateMachine.State);
}).on("error", (err: any) => {
    console.error(new Date().toISOString() + ': !!! Error: ' + JSON.stringify(err));
});

let appAdmin = express();
appAdmin.set('jsonp callback name', 'cb');
appAdmin.use(noCache);
appAdmin.use(bodyParser.json({"limit":"999mb"}));
appAdmin.use(prettyPrinter.get());

let g: IGlobal = {
    stateMachine
    ,apiServerMessenger
    ,apiServerMsgTransaction
};

appAdmin.set("global", g);

appAdmin.use("/services", servicesRouter);

startServer(config.adminServerConfig, appAdmin, (secure:boolean, host:string, port:number) => {
    let protocol = (secure ? 'https' : 'http');
    console.log(new Date().toISOString() + ': api gateway <ADMIN> server listening at %s://%s:%s', protocol, host, port);
    stateMachine.initialize();
}, (err:any) => {
    console.error(new Date().toISOString() + ': !!! api gateway <ADMIN> server error: ' + JSON.stringify(err));
    process.exit(1);
});