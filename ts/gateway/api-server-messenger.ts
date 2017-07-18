import * as express from 'express';
import * as events from "events";
import * as tr from 'rcf-message-router';
import {Message, ServerId, ApiServerReadyResult} from "../message";
import * as svrmgr from "./server-mgr";
import * as msgtxp from "msg-transaction-processor";
import {MsgTopic} from "../utils";

export interface IApiServerMessenger {
    on(event: "instance-launched", listener: (InstanceId: ServerId, readyResult: ApiServerReadyResult) => void) : this;
}

class ApiServerMessenger extends events.EventEmitter implements IApiServerMessenger {
    constructor(private connectionsManager: tr.IConnectionsManager) {
        super();
        this.connectionsManager.on("on_client_send_msg", (req:express.Request, connection: tr.ITopicConnection, params: tr.SendMsgParams) => {
            if (params.destination === '/topic/gateway') {
                let msg:Message = params.body;
                if (msg.type === "ready") {
                    let content: ApiServerReadyResult = msg.content;
                    let InstanceId = content.InstanceId;
                    connection.cookie = InstanceId;
                    this.emit("instance-launched", InstanceId, content);
                }
            }
        });
    }
}

export function get(connectionsManager: tr.IConnectionsManager) : IApiServerMessenger {return new ApiServerMessenger(connectionsManager);}