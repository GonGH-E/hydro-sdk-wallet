import HydroWallet from "./hydroWallet";
import ExtensionWallet from "./extensionWallet";
import BaseWallet from "./baseWallet";

const { NeedUnlockWalletError, NotSupportedError } = BaseWallet;
export {
  HydroWallet,
  ExtensionWallet,
  NeedUnlockWalletError,
  NotSupportedError
};

export const getWalletName = (type: string): string => {
  if (type === ExtensionWallet.getType()) {
    return ExtensionWallet.WALLET_NAME;
  } else if (type.indexOf(HydroWallet.TYPE_PREFIX) > -1) {
    return HydroWallet.WALLET_NAME;
  } else {
    return "Unknown Wallet";
  }
};

export const isHydroWallet = (type: string): boolean => {
  return getWalletName(type) === HydroWallet.WALLET_NAME;
};
