export type ServerId = string;

export type MsgType = "ready" | "terminate-req" | "treminate-ack" | "api-state-query" | "api-state";

//  MsgType = "ready"
export interface ApiServerReadyResult {
    InstanceId: ServerId;
    NODE_PATH?: string;
}

// MsgType = "api-state-query"
export interface ApiServerStateQuery {
    QueryId: string;
}

export interface ApiServerState {
    InstanceId: ServerId;
    RequestCounter: number;
}

// MsgType = "treminate-ack"
export type TerminateAckResult = ApiServerState;

// MsgType = "api-state"
export interface ApiServerStateQueryResult extends ApiServerStateQuery {
    State: ApiServerState;
}

export interface Message {
    type: MsgType;
    content?: any;
}