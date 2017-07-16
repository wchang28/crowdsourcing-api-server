import * as express from 'express';
import * as events from "events";
import * as tr from 'rcf-message-router';
import {Message, ServerId, ApiServerReadyResult, ApiServerStateQuery, ApiServerStateQueryResult, TerminateAckResult} from "../message";
import * as svrmgr from "./server-mgr";
import * as msgtxp from "msg-transaction-processor";
import {MsgTopic} from "../utils";

export interface IApiServerMessenger {
    requestToTerminate(InstanceId: string): void;
    queryState(InstanceId: string, QueryId: string): void;
    on(event: "instance-launched", listener: (InstanceId: ServerId, readyResult: ApiServerReadyResult) => void) : this;
    on(event: "instance-terminate-req", listener: (InstanceId: ServerId) => void) : this;
    on(event: "instance-terminate-ack", listener: (InstanceId: ServerId, ackResult: TerminateAckResult) => void) : this;
    on(event: "instance-terminated", listener: (InstanceId: ServerId) => void): this;
    on(event: "transaction-res-rcvd", listener: (TransactionId: msgtxp.TransactionId, result: any) => void) : this;
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
                } else if (msg.type === "api-state") {
                    let content: ApiServerStateQueryResult = msg.content;
                    this.emit("transaction-res-rcvd", content.QueryId, content.State);
                } else if (msg.type === "treminate-ack") {
                    let content: TerminateAckResult = msg.content;
                    this.emit("instance-terminate-ack", content.InstanceId, content);
                }
            }
        }).on("client_disconnect", (req:express.Request, connection: tr.ITopicConnection) => {
            let InstanceId: ServerId = connection.cookie;
            this.emit("instance-terminated", InstanceId);
        });
    }
    requestToTerminate(InstanceId: ServerId): void {
        this.emit("instance-terminate-req", InstanceId);
        let msg: Message = {type: "terminate-req"};
        this.connectionsManager.dispatchMessage(MsgTopic.getApiServerInstanceTopic(InstanceId), {}, msg);
    }
    queryState(InstanceId: ServerId, QueryId: string): void {
        let content: ApiServerStateQuery = {QueryId};
        let msg: Message = {type: "api-state-query", content};
        this.connectionsManager.dispatchMessage(MsgTopic.getApiServerInstanceTopic(InstanceId), {}, msg);
    }
}

export function get(connectionsManager: tr.IConnectionsManager) : IApiServerMessenger {return new ApiServerMessenger(connectionsManager);}