import * as express from 'express';
import {IWebServerConfig, startServer} from 'express-web-server';
import * as rcf from "rcf";
import * as node$ from "rest-node";
import {Message, ApiServerReadyResult} from "../message";
import * as af from "./app-factory";
import {MsgTopic} from "../utils";

let NODE_PATH = process.env["NODE_PATH"];
let Mode : "deploy" | "debug" = null;
let Port = (process.argv.length >= 3 ? parseInt(process.argv[2]) : 80);
let MsgPort: number = null;
let InstanceId: string = null;

if (process.argv.length >= 4) {
    Mode = "deploy";
    MsgPort = parseInt(process.argv[3]);
    InstanceId = process.argv[4];
} else
    Mode = "debug";

console.log("NODE_PATH=" + NODE_PATH);
console.log("Mode=" + Mode);
console.log("Port=" + Port);
if (Mode === "deploy") {
    console.log("MsgPort=" + MsgPort);
    console.log("InstanceId=" + InstanceId);
}

function startApiAppServer(appFactory: af.IAPIAppFactory, port: number, callback?: () => void) {
    console.log(new Date().toISOString() + ": starting the crowdsourcing api server...");
    startServer({http:{port, host: "127.0.0.1"}}, appFactory.create(), (secure:boolean, host:string, port:number) => {
        let protocol = (secure ? 'https' : 'http');
        console.log(new Date().toISOString() + ': crowdsourcing api server listening at %s://%s:%s', protocol, host, port);
        if (typeof callback === "function") callback();
    }, (err:any) => {
        console.error(new Date().toISOString() + ': !!! crowdsourcing api server error: ' + JSON.stringify(err));
        process.exit(1);
    });
}

let appFactory = af.get({SelfPort: Port});

if (Mode === "deploy") {
    console.log(new Date().toISOString() + ": connecting to the gateway msg server...");
    let api = new rcf.AuthorizedRestApi(node$.get(), {instance_url: "http://127.0.0.1:" + MsgPort.toString()});
    let msgClient = api.$M("/msg/events", {reconnetIntervalMS: 3000});
    msgClient.on("connect", (conn_id: string) => {
        console.log(new Date().toISOString() + ": connected to the gateway msg server :-) conn_id=" + conn_id);
        
        startApiAppServer(appFactory, Port, () => {
            // inform the API gateway that we are ready to receive API calls
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let content: ApiServerReadyResult = {InstanceId, NODE_PATH};
            let msg: Message = {type: "ready", content};
            msgClient.send(MsgTopic.getApiGetewayTopic(), {}, msg).then(() => {
                console.log(new Date().toISOString() + ": <<ready>> message sent");
            }).catch((err: any) => {
                console.error(new Date().toISOString() + ': !!! crowdsourcing api server error: ' + JSON.stringify(err));
                process.exit(1);
            });
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        });
    }).on("error", (err: any) => {
        console.error(new Date().toISOString() + ': !!! Error: ' + JSON.stringify(err));
    }).on("ping", () => {
        console.log(new Date().toISOString() + ": <<PING>>");
    });
} else    // debug
    startApiAppServer(appFactory, Port);