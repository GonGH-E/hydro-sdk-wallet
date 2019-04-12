import * as React from "react";
import Select, { Option } from "./Select";
import { getWalletName } from "../../connector/wallets";
import { connector } from "../../connector";

interface Props {
  walletIsSupported: boolean;
  walletIsLocked: boolean;
  walletName: string;
}

interface State {}

class SelectWallet extends React.PureComponent<Props, State> {
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
    const typesOptions = this.getTypesOptions();
    const typesSelectorDisabled = typesOptions.length === 0;
    return (
      <>
        <div className="HydroSDK-fieldGroup">
          <div className="HydroSDK-label">Select Type</div>
          <Select
            blank={
              typesSelectorDisabled
                ? "Not Found Any Addresses"
                : "Please Select A Address"
            }
            noCaret={typesSelectorDisabled}
            disabled={typesSelectorDisabled}
            options={typesOptions}
            selected={connector.selectedType}
          />
        </div>
      </>
    );
  }

  private getTypesOptions(): Option[] {
    return this.getWalletTypes(this.props.walletName).map((type: string) => {
      let text = connector.getAddress(type);
      if (!text) {
        const connection = connector.getConnection(type)!;
        if (!connection.isSupported()) {
          text = "Current Wallet Type Is Not Supported";
        } else {
          text = "Not Found Any Addresses";
        }
      }
      return {
        value: type,
        text,
        onSelect: (option: Option) => {
          connector.selectConnection(option.value);
        }
      };
    });
  }

  private getWalletTypes(walletName: string): string[] {
    return connector.getSupportedTypes().filter(type => {
      return getWalletName(type) === walletName;
    });
  }
}

export default SelectWallet;
