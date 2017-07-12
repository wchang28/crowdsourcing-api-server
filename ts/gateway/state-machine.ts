import {ServerId} from "../message";
import * as events from "events";

export type State = "uninitizlized" | "initializing" | "ready" | "switching" | "switched";

export type ServerState = "initializing" | "ready" | "terminating";

export interface ServerInstance {
    Id: ServerId;
    InstanceUrl: string;
}

export interface Server extends ServerInstance {
    State: ServerState;
}

export interface IServerManager {
    launchNewInstance() : Promise<ServerInstance>;
    terminateInstance(InstanceId: ServerId) : void;
    on(event: "instance-launched", listener: (InstanceId: ServerId) => void) : this;
    on(event: "instance-terminated", listener: (InstanceId: ServerId) => void): this;
}

export interface StateMachineJSON {
    State: State;
    TargetInstanceUrl: string;
    CurrentServer: Server;
    NewServer: Server;
    OldServer: Server;
}

export interface IStateMachine {
    readonly State: State;
    initialize() : Promise<ServerInstance>;
    deploy() : Promise<any>;
    readonly TargetInstanceUrl : string;
    readonly CurrentServer : Server;
    readonly NewServer : Server;
    readonly OldServer : Server;
    toJSON() : StateMachineJSON;
    on(event: "change", listener: () => void) : this;
    on(event: "ready", listener: () => void) : this;
    on(event: "error", listener: (err: any) => void) : this;
}

class StateMachine extends events.EventEmitter implements IStateMachine {
    private _currentServer: Server = null;
    private _newServer: Server = null;
    private _oldServer: Server = null;
    private _newServerLauncherTimer: NodeJS.Timer;
    private _newServerLaunchCompletionCallback: (err: any) => void;
    constructor(private serverManager: IServerManager) {
        super();
        this._currentServer = null;
        this._newServer = null;
        this._oldServer = null;
        this._newServerLauncherTimer = null;
        this._newServerLaunchCompletionCallback = null;

        serverManager.on("instance-launched", (InstanceId: ServerId) => {
            if (this.State === "initializing" || this.State === "switching") {
                if (this._newServerLauncherTimer) {
                    clearTimeout(this._newServerLauncherTimer);
                    this._newServerLauncherTimer = null;
                }
                if (this._currentServer === null) { // "initializing" => "ready"
                    this._newServer.State = "ready";
                    this._currentServer = this._newServer;
                    this._newServer = null;
                    this.emit("ready");
                } else {    // "switching" => // "swtiched"
                    this._oldServer = this._currentServer;
                    this._oldServer.State = "terminating";
                    this._newServer.State = "ready";
                    this._currentServer = this._newServer;
                    this._newServer = null;
                    this.serverManager.terminateInstance(this._oldServer.Id);
                }
                if (typeof this._newServerLaunchCompletionCallback === "function") {
                    this._newServerLaunchCompletionCallback(null);
                    this._newServerLaunchCompletionCallback = null;
                }
                this.emit("change");
            }
        }).on("instance-terminated", (InstanceId: ServerId) => {
            if (this.State === "switched") {
                this._oldServer = null;
                // back to "ready"
                this.emit("change");
            }
        });
    }
    initialize() : Promise<ServerInstance> {
        if (this.State != "uninitizlized")
            return Promise.reject({error: "invalid-request", error_description: "already initialized"});
        else
            return this.launchNewServer();
    }
    get State() : State {
        if (this._currentServer === null && this._newServer === null && this._oldServer === null)
            return "uninitizlized";
        else if (this._currentServer === null && this._newServer !== null && this._oldServer === null)
            return "initializing";
        else if (this._currentServer !== null && this._newServer === null && this._oldServer === null)
            return "ready";
        else if (this._currentServer !== null && this._newServer !== null && this._oldServer === null)
            return "switching";
        else if (this._currentServer !== null && this._newServer === null && this._oldServer !== null)
            return "switched";
        else
            throw "bad state";
    }
    private launchNewServer(): Promise<ServerInstance> {
        if (this.State != "uninitizlized" && this.State != "ready")
            return Promise.reject({error: "invalid-request", error_description: "not ready"});
        else {
            return this.serverManager.launchNewInstance().then((Instance: ServerInstance) => {
                this._newServer = {Id: Instance.Id, InstanceUrl: Instance.InstanceUrl, State: "initializing"};
                // "initializing" or "switching"
                this.emit("change");
                this._newServerLauncherTimer = setTimeout(() => {
                    this._newServerLauncherTimer = null;
                    this._newServer = null;
                    // back to "uninitizlized" or "ready"
                    this.emit("change");
                    let err = {error: "timeout", error_description: "new server launch timeout"};
                    if (typeof this._newServerLaunchCompletionCallback === "function") {
                        this._newServerLaunchCompletionCallback(err);
                        this._newServerLaunchCompletionCallback = null;
                    }
                    this.emit("error", err);
                }, 60000);
                return Instance;
            });
        }
    }
    deploy() : Promise<any> {
        if (this.State !== "ready")
            return Promise.reject({error: "invalid-request", error_description: "not ready"});
        else {
            return new Promise<any>((resolve: (value: any) => void, reject: (err: any) => void) => {
                this.launchNewServer()
                .then((Instance: ServerInstance) => {
                    this._newServerLaunchCompletionCallback = (err: any) => {
                        if (err)
                            reject(err);
                        else
                            resolve({deployed: true});
                    };
                }).catch((err: any) => {
                    reject(err);
                });
            });
        }
    }
    get TargetInstanceUrl() : string {return (this._currentServer ? this._currentServer.InstanceUrl : null);}
    get CurrentServer() : Server {return this._currentServer;}
    get NewServer() : Server {return this._newServer;}
    get OldServer() : Server {return this._oldServer;}
    toJSON() : StateMachineJSON {
        return {
            State: this.State
            ,TargetInstanceUrl: this.TargetInstanceUrl
            ,CurrentServer: this.CurrentServer
            ,NewServer: this.NewServer
            ,OldServer: this.OldServer
        };
    }
}

export function get(serverManager: IServerManager) : IStateMachine {return new StateMachine(serverManager);}