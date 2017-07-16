import {ServerId} from "./message";

export class MsgTopic {
    static getApiServerInstanceTopic(InstanceId: ServerId) : string {return "/topic/"+ InstanceId;}
    static getApiGetewayTopic() : string {return "/topic/gateway";}
}