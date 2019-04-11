import * as React from "react";
import { connectorInstance, Connector } from "../../connector";
import {
  HydroWallet,
  getWalletName,
  ExtensionWallet
} from "../../connector/wallets";
import Select, { Option } from "./Select";

interface State {
  hidden: boolean;
  selectedWalletName: string;
}

interface Props {}

class Wallet extends React.PureComponent<Props, State> {
  private connector: Connector;
  constructor(props: Props) {
    super(props);
    this.connector = connectorInstance;
    this.connector.setForceUpdate(this.forceUpdate.bind(this));
    this.state = {
      hidden: false,
      selectedWalletName: getWalletName(this.connector.selectedType)
    };
  }

  public render() {
    const { hidden, selectedWalletName } = this.state;

    return (
      <div className="wallet">
        <button
          className="toggleButton"
          onClick={() => this.setState({ hidden: false })}
        >
          Click Show Wallet Wizard
        </button>

        <div className="dialog" hidden={hidden}>
          <div className="backdrop" />
          <div className="title">Hydro SDK Wallet</div>
          <div className="selectGroup">
            <div className="label">Select Wallet</div>
            <Select
              options={this.getWalletsOptions()}
              selected={selectedWalletName}
            />
          </div>
          <div className="selectGroup">
            <div className="label">Select Type</div>
            <Select
              options={this.getTypesOptions()}
              selected={this.connector.selectedType}
            />
          </div>
          <div className="footer">
            <button
              className="closeButton"
              onClick={() => this.setState({ hidden: true })}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  private handleSelect(type: string) {
    this.connector && this.connector.selectConnection(type);
  }

  private getWalletsOptions(): Option[] {
    const onSelect = (option: Option) => {
      this.setState({ selectedWalletName: option.value });
      this.connector.selectConnection(this.getWalletTypes(option.value)[0]);
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

  private getTypesOptions(): Option[] {
    return this.getWalletTypes(this.state.selectedWalletName).map(
      (type: string) => {
        return {
          value: type,
          text: this.connector.getAddress(type)!,
          onSelect: (option: Option) => {
            this.handleSelect(option.value);
          }
        };
      }
    );
  }

  private getWalletTypes(walletName: string): string[] {
    return this.connector.getSupportedTypes().filter(type => {
      return getWalletName(type) === walletName;
    });
  }
}
export default Wallet;
