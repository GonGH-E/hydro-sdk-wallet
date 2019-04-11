import { txParams } from "..";
import { BigNumber } from "ethers/utils";

export default abstract class baseWallet {
  public abstract signMessage(message: string): Promise<string> | null;

  public abstract personalSignMessage(message: string): Promise<string>;

  public abstract sendTransaction(txParams: txParams): Promise<any>;

  public abstract getAccounts(): Promise<string[]>;

  public abstract isLocked(): boolean;

  public abstract loadBalance(): Promise<any>;

  public abstract setAddress(address: string | null): void;

  public abstract getType(): string;

  public abstract getAddress(): string | null;

  public abstract getBalance(): BigNumber;
}
