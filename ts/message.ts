export type ServerId = string;

export type MsgType = "ready" | "terminate" | "api-state-query" | "api-state";

//  MsgType = "ready"
export interface ReadyContent {
    InstanceId: ServerId;
    NODE_PATH?: string;
}

// MsgType = "api-state-query"
export interface ApiServerStateQuery {
    QueryId: string;
}

// MsgType = "api-state"
export interface ApiServerState {
    QueryId: string;
    InstanceId: ServerId;
    RequestCounter: number;
}

export interface Message {
    type: MsgType;
    content?: any;
}