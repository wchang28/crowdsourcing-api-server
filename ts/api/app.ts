import * as express from 'express';
import {IWebServerConfig, startServer} from 'express-web-server';
import * as rc from "express-req-counter";
import * as rcf from "rcf";
import * as node$ from "rest-node";
import {Message, ReadyContent} from "../message";
import * as af from "./app-factory";

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

let terminationPending = false;

let reqCounter = rc.get();

function flagTerminationPending() {
    terminationPending = true;
    if (reqCounter.Counter === 0)
        process.exit(0);
}

reqCounter.on("zero-count", () => {
    if (terminationPending)
        process.exit(0);
})

let appFactory = af.get({SelfPort: Port});

if (Mode === "deploy") {
    appFactory.on("app-just-created", (app: express.Express) => {
        app.use(reqCounter.Middleware); // install the request counter middleware to app
    });

    console.log(new Date().toISOString() + ": connecting to the gateway msg server...");
    let api = new rcf.AuthorizedRestApi(node$.get(), {instance_url: "http://127.0.0.1:" + MsgPort.toString()});
    let msgClient = api.$M("/msg/events", {reconnetIntervalMS: 3000});
    msgClient.on("connect", (conn_id: string) => {
        console.log(new Date().toISOString() + ": connected to the gateway msg server :-) conn_id=" + conn_id);
        msgClient.subscribe("/topic/" + InstanceId, (msg: rcf.IMessage) => {
            if (msg.body) {
                let message : Message = msg.body;
                if (message.type === "terminate") {
                    flagTerminationPending();
                }
            }
        }).then((sub_id: string) => {
            console.log(new Date().toISOString() + ": topic subscription successful, sub_id=" + sub_id);
            startApiAppServer(appFactory, Port, () => {
                let content: ReadyContent = {InstanceId, NODE_PATH};
                let msg: Message = {type: "ready", content};
                msgClient.send("/topic/gateway", {}, msg).then(() => {
                    console.log(new Date().toISOString() + ": <<ready>> message sent");
                }).catch((err: any) => {
                    console.error(new Date().toISOString() + ': !!! crowdsourcing api server error: ' + JSON.stringify(err));
                    process.exit(1);
                });
            });
        }).catch((err: any) => {
            console.error(new Date().toISOString() + ': !!! Error subscribing to topic: ' + JSON.stringify(err));
            process.exit(1);
        });
    }).on("error", (err: any) => {
        console.error(new Date().toISOString() + ': !!! Error: ' + JSON.stringify(err));
    }).on("ping", () => {
        console.log(new Date().toISOString() + ": <<PING>>");
    });
} else    // debug
    startApiAppServer(appFactory, Port);