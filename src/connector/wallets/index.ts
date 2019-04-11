import HydroWallet, { NeedUnlockWalletError } from "./hydroWallet";
import ExtensionWallet, { NotFoundAddressError } from "./extensionWallet";

export {
  HydroWallet,
  ExtensionWallet,
  NeedUnlockWalletError,
  NotFoundAddressError
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
