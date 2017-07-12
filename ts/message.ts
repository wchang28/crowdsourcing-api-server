export type ServerId = string;

export type MsgType = "ready" | "terminate";

export interface ReadyContent {
    InstanceId: ServerId;
    NODE_PATH?: string;
}

export interface Message {
    type: MsgType;
    content?: any;
}