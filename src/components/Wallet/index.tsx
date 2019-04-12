import * as React from "react";
import { connector } from "../../connector";
import WalletSelector from "./WalletSelector";
import Create from "./Create";
import Import from "./Import";
import Input from "./Input";
import Select, { Option } from "./Select";
import {
  HydroWallet,
  getWalletName,
  ExtensionWallet,
  isHydroWallet
} from "../../connector/wallets";

const STEPS = {
  SELETE: "SELETE",
  CREATE: "CREATE",
  IMPORT: "IMPORT"
};

interface State {
  hidden: boolean;
  selectedWalletName: string;
  step: string;
  password: string;
  processing: boolean;
}

interface Props {}

class Wallet extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    connector.setForceUpdate("HydroSDK-Wallet", this.forceUpdate.bind(this));
    this.state = {
      step: STEPS.SELETE,
      hidden: true,
      selectedWalletName: getWalletName(connector.selectedType),
      password: "",
      processing: false
    };
  }

  componentDidMount() {
    connector.setForceUpdate(
      this.constructor.name,
      this.forceUpdate.bind(this)
    );
  }

  componentWillUnmount() {
    connector.removeForceUpdate(this.constructor.name);
  }

  public render() {
    const { hidden, selectedWalletName } = this.state;

    return (
      <div className="HydroSDK-wallet">
        <button
          className="HydroSDK-toggleButton"
          onClick={() => this.setState({ hidden: false })}
        >
          {connector.getSelectedAddress() || "Please Click to Select A Wallet"}
        </button>
        <div className="HydroSDK-container" hidden={hidden}>
          <div className="HydroSDK-backdrop" />
          <div className="HydroSDK-dialog">
            <div className="HydroSDK-title">Hydro SDK Wallet</div>
            <div className="HydroSDK-fieldGroup">
              <div className="HydroSDK-label">Select Wallet</div>
              <Select
                options={this.getWalletsOptions()}
                selected={selectedWalletName}
              />
            </div>
            {this.renderStepContent()}
            {this.renderUnlockForm()}
            <div className="HydroSDK-footer">
              <button
                className="HydroSDK-closeButton"
                onClick={() => this.setState({ hidden: true })}
              >
                Close
              </button>
              {this.renderHydroWalletButtons()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderUnlockForm() {
    const { password, selectedWalletName } = this.state;
    if (
      selectedWalletName !== HydroWallet.WALLET_NAME ||
      !isHydroWallet(connector.selectedType) ||
      !connector.getSelectedConnection()!.isLocked()
    ) {
      return null;
    }

    return (
      <Input
        label="Password"
        text={password}
        handleChange={(password: string) => this.setState({ password })}
      />
    );
  }

  private renderStepContent() {
    const { step, selectedWalletName } = this.state;
    switch (step) {
      case STEPS.SELETE:
        return (
          <WalletSelector
            walletIsSupported={connector.getSelectedConnection()!.isSupported()}
            walletIsLocked={connector.getSelectedConnection()!.isLocked()}
            walletName={selectedWalletName}
          />
        );
      case STEPS.CREATE:
        return (
          <Create callback={() => this.setState({ step: STEPS.SELETE })} />
        );
      case STEPS.IMPORT:
        return (
          <Import callback={() => this.setState({ step: STEPS.SELETE })} />
        );
      default:
        return null;
    }
  }

  private renderHydroWalletButtons(): JSX.Element | null {
    const { step, processing } = this.state;
    if (!isHydroWallet(connector.selectedType) || step !== STEPS.SELETE) {
      return null;
    }
    return (
      <div className="HydroSDK-hydroWalletButtonGroup">
        <button
          className="HydroSDK-featureButton"
          onClick={() => this.setState({ step: STEPS.CREATE })}
        >
          Create Wallet
        </button>
        <button
          className="HydroSDK-featureButton"
          onClick={() => this.setState({ step: STEPS.IMPORT })}
        >
          Import Wallet
        </button>
        {isHydroWallet(connector.selectedType) &&
          connector.getSelectedConnection()!.isLocked() && (
            <button
              className="HydroSDK-featureButton"
              disabled={processing}
              onClick={async () => await this.handleUnlock()}
            >
              {processing ? <i className="HydroSDK-loading" /> : null} Unlock
            </button>
          )}
      </div>
    );
  }

  private async handleUnlock(): Promise<void> {
    const { password } = this.state;
    this.setState({ processing: true });
    await connector.unlock(password);
    this.setState({ processing: false });
  }

  private getWalletsOptions(): Option[] {
    const onSelect = (option: Option) => {
      this.setState({ selectedWalletName: option.value, step: STEPS.SELETE });
    };
    return [
      {
        value: HydroWallet.WALLET_NAME,
        text: HydroWallet.WALLET_NAME,
        onSelect
      },
      {
        value: ExtensionWallet.WALLET_NAME,
        text: ExtensionWallet.WALLET_NAME,
        onSelect
      }
    ];
  }
}
export default Wallet;
