import {
  HydroWallet,
  ExtensionWallet,
  NeedUnlockWalletError,
  NotSupportedError
} from "./wallets";
import { BigNumber } from "ethers/utils";

declare global {
  interface Window {
    web3: any;
    ethereum: any;
  }
}

export interface txParams {
  from?: string;
  to: string;
  data?: string;
  value?: number | string | BigNumber;
  gasPrice?: number;
  gasLimit?: number;
}

export type Connection = HydroWallet | typeof ExtensionWallet;

export default class Connector {
  private accountWatchers: Map<string, number> = new Map();
  public connections: Map<string, Connection> = new Map();
  public selectedType: string;
  private nodeUrl?: string;
  private forceUpdate: Map<string, () => any> = new Map();
  // private updateAccountCallback?: (account?: string) => any
  // private updateBalancecallback?: (balance?: BigNumber) => any

  public constructor() {
    this.selectedType =
      window.localStorage.getItem("HydroWallet:lastSelectedType") ||
      ExtensionWallet.getType();
    this.startAccountWatchers();
  }

  public setNodeUrl(nodeUrl: string): void {
    this.nodeUrl = nodeUrl;
    this.refreshWatchers();
  }

  public setForceUpdate(componentName: string, forceUpdate: () => any): void {
    console.log("set forceUpdate: ", componentName);
    this.forceUpdate.set(componentName, forceUpdate);
  }

  public removeForceUpdate(componentName: string): void {
    console.log("remove forceUpdate: ", componentName);
    this.forceUpdate.delete(componentName);
  }

  public getSupportedTypes(): string[] {
    return Array.from(this.connections.keys());
  }

  public getSelectedConnection(): Connection | undefined {
    return this.getConnection(this.selectedType);
  }

  public getConnection(type: string): Connection | undefined {
    return this.connections.get(type);
  }

  public getSelectedAddress(): string | null {
    return this.getAddress(this.selectedType);
  }

  public getAddress(type: string): string | null {
    const connection = this.getConnection(type);
    return connection ? connection.getAddress() : null;
  }

  public unlock(password: string): void {
    const selectedConnection = this.getSelectedConnection();
    if (selectedConnection) {
      selectedConnection.unlock(password);
    }
  }

  public selectConnection(type: string): void {
    if (type === this.selectedType) {
      return;
    }
    if (this.connections.get(type)) {
      if (type === ExtensionWallet.getType()) {
        ExtensionWallet.enableBrowserExtensionWallet();
      }
      this.selectedType = type;
      window.localStorage.setItem("HydroWallet:lastSelectedType", type);
      this.refreshWatchers();
      this.callForceUpdate();
      return;
    } else {
      return;
    }
  }

  private callForceUpdate(): void {
    console.log("call force update");
    this.forceUpdate.forEach(fn => {
      fn();
    });
  }
  private loadExtensionWallet(): void {
    this.connections.set(ExtensionWallet.getType(), ExtensionWallet);
  }

  private loadHydroWallets(): void {
    HydroWallet.list().map(wallet => {
      const type = wallet.getType();
      if (this.nodeUrl) {
        wallet.setNodeUrl(this.nodeUrl);
      }
      this.connections.set(type, wallet);
    });
  }

  private startAccountWatchers(): void {
    this.loadHydroWallets();
    this.loadExtensionWallet();
    const promises: Array<Promise<any>> = [];
    promises.push(this.watchWallet(ExtensionWallet.getType()));
    HydroWallet.list().map((wallet: HydroWallet) => {
      promises.push(this.watchWallet(wallet.getType()));
    });
    Promise.all(promises);
  }

  private watchWallet(type: string): Promise<[void, void]> {
    const watchAccount = async (timer = 0) => {
      const timerKey = `${type}-account`;
      if (
        timer &&
        this.accountWatchers.get(timerKey) &&
        timer !== this.accountWatchers.get(timerKey)
      ) {
        return;
      }

      await this.loadAccount(type);
      const nextTimer = window.setTimeout(() => watchAccount(nextTimer), 3000);
      this.accountWatchers.set(timerKey, nextTimer);
    };

    const watchBalance = async (timer = 0) => {
      console.log("watch Balance");
      const timerKey = `${type}-balance`;
      if (
        timer &&
        this.accountWatchers.get(timerKey) &&
        timer !== this.accountWatchers.get(timerKey)
      ) {
        return;
      }
      await this.loadBalance(type);
      const watcherRate = this.getWatcherRate(type);
      const nextTimer = window.setTimeout(
        () => watchBalance(nextTimer),
        watcherRate
      );
      this.accountWatchers.set(timerKey, nextTimer);
    };

    return Promise.all([watchAccount(), watchBalance()]);
  }

  private async loadAccount(type: string): Promise<void> {
    const connection = this.connections.get(type);
    if (!connection) {
      return;
    }
    let account;

    try {
      const accounts: string[] = await connection.getAccounts();
      account = accounts.length > 0 ? accounts[0].toLowerCase() : null;
    } catch (e) {
      account = null;
    }
    if (account !== connection.getAddress()) {
      connection.setAddress(account);
      this.callForceUpdate();
    }
  }

  private loadBalance = async (type: string): Promise<void> => {
    console.log("load Balance", type);
    const connection = this.connections.get(type);
    if (!connection) {
      return;
    }

    try {
      const balance = await connection.loadBalance();
      console.log(connection.getAddress(), balance);
      if (!balance.eq(connection.getBalance())) {
        connection.setBalance(balance);
        this.callForceUpdate();
      }
    } catch (e) {
      if (e !== NeedUnlockWalletError && e !== NotSupportedError) {
        throw e;
      }
    }
  };

  private getWatcherRate = (type: string): number => {
    return this.selectedType === type &&
      window.document.visibilityState !== "hidden"
      ? 3000
      : 300000;
  };

  public async refreshWatchers(): Promise<void> {
    this.clearTimers();
    await this.startAccountWatchers();
  }

  public clearTimers(): void {
    this.accountWatchers.forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
  }
}
