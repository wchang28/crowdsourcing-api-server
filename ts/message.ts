export type ServerId = string;

export type MsgType = "ready";

export interface Message {
    type: MsgType;
    content?: any;
}

//  MsgType = "ready"
export interface ApiServerReadyResult {
    InstanceId: ServerId;
    NODE_PATH?: string;
}