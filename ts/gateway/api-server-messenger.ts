import * as express from 'express';
import * as events from "events";
import * as tr from 'rcf-message-router';
import {Message, ServerId, ReadyContent, ApiServerStateQuery, ApiServerStateQueryResult} from "../message";
import * as svrmgr from "./server-mgr";
import * as msgtx from "./msg-transaction";
import {MsgTopic} from "../utils";

export interface IApiServerMessenger {
    notifyToTerminate(InstanceId: string): void;
    queryState(InstanceId: string, QueryId: string): void;
    on(event: "instance-launched", listener: (InstanceId: ServerId) => void) : this;
    on(event: "instance-terminated", listener: (InstanceId: ServerId) => void): this;
    on(event: "transaction-res-rcvd", listener: (TransactionId: msgtx.TransactionId, result: any) => void) : this;
}

class ApiServerMessenger extends events.EventEmitter implements IApiServerMessenger {
    constructor(private connectionsManager: tr.IConnectionsManager) {
        super();
        this.connectionsManager.on("on_client_send_msg", (req:express.Request, connection: tr.ITopicConnection, params: tr.SendMsgParams) => {
            if (params.destination === '/topic/gateway') {
                let msg:Message = params.body;
                if (msg.type === "ready") {
                    let content: ReadyContent = msg.content;
                    let InstanceId = content.InstanceId;
                    if (content.NODE_PATH)
                        console.log(new Date().toISOString() + ": NEW server reported NODE_PATH=" + content.NODE_PATH);
                    else
                        console.error(new Date().toISOString() + "!!! Error: server did not receive NODE_PATH env. variable");
                    connection.cookie = InstanceId;
                    this.emit("instance-launched", InstanceId);
                } else if (msg.type === "api-state") {
                    let content: ApiServerStateQueryResult = msg.content;
                    this.emit("transaction-res-rcvd", content.QueryId, content.State);
                }
            }
        }).on("client_disconnect", (req:express.Request, connection: tr.ITopicConnection) => {
            let InstanceId: ServerId = connection.cookie;
            this.emit("instance-terminated", InstanceId);
        });
    }
    notifyToTerminate(InstanceId: ServerId): void {
        let msg: Message = {type: "terminate"};
        this.connectionsManager.dispatchMessage(MsgTopic.getApiServerInstanceTopic(InstanceId), {}, msg);
    }
    queryState(InstanceId: ServerId, QueryId: string): void {
        let content: ApiServerStateQuery = {QueryId};
        let msg: Message = {type: "api-state-query", content};
        this.connectionsManager.dispatchMessage(MsgTopic.getApiServerInstanceTopic(InstanceId), {}, msg);
    }
}

export function get(connectionsManager: tr.IConnectionsManager) : IApiServerMessenger {return new ApiServerMessenger(connectionsManager);}