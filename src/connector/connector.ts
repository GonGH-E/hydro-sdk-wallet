import {
  HydroWallet,
  ExtensionWallet,
  NeedUnlockWalletError,
  NotFoundAddressError
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

type Connection = HydroWallet | typeof ExtensionWallet;

export default class Connector {
  private accountWatchers: Map<string, number> = new Map();
  public connections: Map<string, Connection> = new Map();
  public selectedType: string;
  private nodeUrl?: string;
  private forceUpdate?: () => any;

  public constructor() {
    this.loadHydroWallets();
    this.loadExtensionWallet();
    this.selectedType =
      window.localStorage.getItem("HydroWallet:lastSelectedType") ||
      this.getSupportedTypes()[1];
    this.startAccountWatchers();
  }

  public setNodeUrl(nodeUrl: string) {
    this.nodeUrl = nodeUrl;
  }

  public setForceUpdate(forceUpdate: () => any) {
    this.forceUpdate = forceUpdate;
  }

  public getSupportedTypes() {
    return Array.from(this.connections.keys());
  }

  public getConnection(type: string): Connection | undefined {
    return this.connections.get(type);
  }

  public getSelectedAddress(type: string): string | null {
    const connection = this.getConnection(type);
    return connection ? connection.getAddress() : null;
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
      if (this.forceUpdate) {
        this.forceUpdate();
      }
      return;
    } else {
      return;
    }
  }

  private loadExtensionWallet(): void {
    if (window && window.web3) {
      this.connections.set(ExtensionWallet.getType(), ExtensionWallet);
    }
  }

  private loadHydroWallets() {
    if (this.nodeUrl) {
      HydroWallet.setNodeUrl(this.nodeUrl);
    }
    HydroWallet.list().map(wallet => {
      const type = wallet.getType();
      this.connections.set(type, wallet);
    });
  }

  private startAccountWatchers(): void {
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
      if (this.forceUpdate) {
        this.forceUpdate();
      }
    }
  }

  private loadBalance = async (type: string): Promise<void> => {
    const connection = this.connections.get(type);
    if (!connection) {
      return;
    }

    try {
      const balance = await connection.loadBalance();
      if (balance === connection.getBalance()) {
        connection.setBalance(balance);
        if (this.forceUpdate) {
          this.forceUpdate();
        }
      }
    } catch (e) {
      if (e !== NeedUnlockWalletError && e !== NotFoundAddressError) {
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
