import * as events from "events";
import * as sm from "./state-machine";
import * as uuid from "uuid";
import * as cp from "child_process"; 
import * as path from 'path';
import {ServerId} from "./types";
import * as kill from "tree-kill";

export interface IServerMonitor {
    monitor(InstanceId: ServerId, InstanceUrl: string) : void;
    on(event: "instance-launched", listener: (InstanceId: ServerId) => void) : this;
}

export interface IServerManager {
    launchNewInstance() : Promise<sm.ServerInstance>;
    terminateInstance(InstanceId: ServerId, pid: number) : void;
    on(event: "instance-launching", listener: (InstanceId: ServerId, InstanceUrl: string) => void) : this;
    on(event: "instance-launched", listener: (InstanceId: ServerId) => void) : this;
    on(event: "instance-terminated", listener: (InstanceId: ServerId) => void): this;
}

interface PortItem {
    Port: number;
    InstanceId: ServerId;
}

class ServerManager extends events.EventEmitter implements IServerManager {
    private _ports: [PortItem, PortItem];
    constructor(availablePorts: [number, number], private NODE_PATH: string, private serverMonitor: IServerMonitor) {
        super();
        this._ports = [{Port:availablePorts[0], InstanceId: null}, {Port:availablePorts[1], InstanceId: null}];
        this.serverMonitor.on("instance-launched", (InstanceId: ServerId) => {
            this.emit("instance-launched", InstanceId);
        });
    }
    private useAvailablePort(InstanceId: ServerId) : number {
        let index = (!this._ports[0].InstanceId ? 0 : 1);
        this._ports[index].InstanceId = InstanceId;
        return this._ports[index].Port;
    }
    private launchNewApiServerInstance(InstanceId: ServerId, Port: number) : Promise<number> {
        let apiAppScript = path.join(__dirname, "../api/app.js");
        let childProcess = cp.spawn("node", [apiAppScript, Port.toString()], {env: {"NODE_PATH": this.NODE_PATH}});
        return Promise.resolve<any>(childProcess.pid);
    }
    launchNewInstance() : Promise<sm.ServerInstance> {
        let InstanceId = uuid.v4();
        let Port = this.useAvailablePort(InstanceId);
        let InstanceUrl = "http://127.0.0.1:" + Port.toString();
        this.emit("instance-launching", InstanceId, InstanceUrl);
        this.serverMonitor.monitor(InstanceId, InstanceUrl);
        return this.launchNewApiServerInstance(InstanceId, Port).then((pid: number) => {
            let ServerInstnace: sm.ServerInstance = {Id: InstanceId, InstanceUrl, pid};
            return Promise.resolve<sm.ServerInstance>(ServerInstnace)
        });  
    }
    terminateInstance(InstanceId: string, pid: number) : void {
        kill(pid, 'SIGKILL', (err: any) => {
            for (let i in this._ports) {
                if (this._ports[i].InstanceId === InstanceId) {
                    this._ports[i].InstanceId = null;
                    break;
                }
            }
            this.emit("instance-terminated", InstanceId);
        });
    }
}

export function get(availablePorts: [number, number], NODE_PATH: string, serverMonitor: IServerMonitor) : IServerManager {return new ServerManager(availablePorts, NODE_PATH, serverMonitor);}