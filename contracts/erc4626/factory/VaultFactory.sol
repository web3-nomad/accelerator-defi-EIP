// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IVaultFactory} from "./IVaultFactory.sol";
import {HederaVault} from "../Vault.sol";
import {FeeConfiguration} from "../../common/FeeConfiguration.sol";
import {IOwnable} from "./IOwnable.sol";

/**
 * @title Vault Factory
 *
 * The contract which allows to deploy Vaults with different parameters
 * and track contract addresses.
 */
contract VaultFactory is Ownable, IVaultFactory, ERC165 {
    // Available Vaults
    mapping(address vault => bool) public availableVaults;

    // Used salt => deployed Vault
    mapping(string => address) public vaultDeployed;

    /**
     * @dev Initializes contract with passed parameters.
     *
     * @param deployer The address of Vault deployer.
     */
    constructor(address deployer) Ownable(msg.sender) {}

    /**
     * @dev Deploys a Vault using CREATE2 opcode.
     * @notice It's required to send at least 12 HBAR for token creation and associations.
     *
     * @param salt The CREATE2 salt.
     * @param vaultDetails The Vault parameters.
     * @param feeConfig The fee configuration setup for Vault.
     * @return vault The address of the deployed Vault.
     */
    function deployVault(
        string calldata salt,
        VaultDetails calldata vaultDetails,
        FeeConfiguration.FeeConfig calldata feeConfig
    ) external payable returns (address vault) {
        require(vaultDeployed[salt] == address(0), "Vault already deployed");
        require(vaultDetails.stakingToken != address(0), "Invalid staking token");
        require(vaultDetails.vaultRewardController != address(0), "Invalid reward controller address");
        require(vaultDetails.feeConfigController != address(0), "Invalid fee controller address");

        vault = _deployVault(salt, vaultDetails, feeConfig);

        availableVaults[vault] = true;

        IOwnable(vault).transferOwnership(msg.sender);

        emit VaultDeployed(vault, vaultDetails.shareTokenName, vaultDetails.shareTokenSymbol);
    }

    /**
     * @dev Creates deployment data for the CREATE2 opcode.
     *
     * @return The the address of the contract created.
     */
    function _deployVault(
        string calldata salt,
        VaultDetails calldata vaultDetails,
        FeeConfiguration.FeeConfig calldata feeConfig
    ) private returns (address) {
        bytes memory _code = type(HederaVault).creationCode;
        bytes memory _constructData = abi.encode(
            vaultDetails.stakingToken,
            vaultDetails.shareTokenName,
            vaultDetails.shareTokenSymbol,
            feeConfig.receiver,
            feeConfig.token,
            feeConfig.feePercentage,
            vaultDetails.vaultRewardController,
            vaultDetails.feeConfigController
        );

        bytes memory deploymentData = abi.encodePacked(_code, _constructData);
        return _deploy(salt, deploymentData);
    }

    /**
     * @dev Deploy function with create2 opcode call.
     *
     * @return The the address of the contract created.
     */
    function _deploy(string calldata salt, bytes memory bytecode) private returns (address) {
        bytes32 saltBytes = bytes32(keccak256(abi.encodePacked(salt)));
        address addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let encoded_data := add(0x20, bytecode) // load initialization code.
            let encoded_size := mload(bytecode) // load init code's length.
            addr := create2(callvalue(), encoded_data, encoded_size, saltBytes)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        return addr;
    }

    /**
     * @dev Checks if Vault is available.
     *
     * @return The bool flag of vault's availability.
     */
    function isVaultAvailable(address vault) external view returns (bool) {
        return availableVaults[vault];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165) returns (bool) {
        return interfaceId == type(IVaultFactory).interfaceId || super.supportsInterface(interfaceId);
    }
}
