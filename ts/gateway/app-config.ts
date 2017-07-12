import {IWebServerConfig} from 'express-web-server';

// application configuration interface
export interface IAppConfig {
    adminServerConfig: IWebServerConfig;
    msgServerConfig: IWebServerConfig;
    proxyServerConfig: IWebServerConfig;
    availableApiServerPorts: [number, number];
    NODE_PATH: string;
}