import { ethers } from 'hardhat';
import { writeFile } from 'fs/promises';
import { createFungibleToken } from "../scripts/utils";
import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";

// Initial function for logs and configs
async function init(): Promise<Record<string, any>> {
  console.log(" - Deploying contracts...");
  return {};
}

// Deploy main contracts for the ERC3643 Standart (T-REX)
async function deployERC3643(contracts: Record<string, any>): Promise<Record<string, any>> {
  console.log(' - Deploying ERC3643 contracts...');
  const [deployer] = await ethers.getSigners();

  //Deploy implementations
  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
  const tokenImplementation = await ethers.deployContract('Token', deployer);
  const identityImplementation = await ethers.deployContract('Identity', [deployer.address, true], deployer);
  const identityImplementationAuthority = await ethers.deployContract('ImplementationAuthority', [await identityImplementation.getAddress()], deployer);
  const identityFactory = await ethers.deployContract('IdFactory', [await identityImplementationAuthority.getAddress()], deployer);
  const identityGateway = await ethers.deployContract('IdentityGateway', [await identityFactory.getAddress(), []], deployer);
  const trexImplementationAuthority = await ethers.deployContract('TREXImplementationAuthority', [true, ethers.ZeroAddress, ethers.ZeroAddress], deployer);

  // creates TREX Factory
  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };

  const contractsStruct = {
    tokenImplementation: await tokenImplementation.getAddress(),
    ctrImplementation: await claimTopicsRegistryImplementation.getAddress(),
    irImplementation: await identityRegistryImplementation.getAddress(),
    irsImplementation: await identityRegistryStorageImplementation.getAddress(),
    tirImplementation: await trustedIssuersRegistryImplementation.getAddress(),
    mcImplementation: await modularComplianceImplementation.getAddress(),
  };

  const trexImplementationAuthorityContract = await ethers.getContractAt(
    "TREXImplementationAuthority",
    await trexImplementationAuthority.getAddress()
  );

  await trexImplementationAuthorityContract.addAndUseTREXVersion(versionStruct, contractsStruct, { gasLimit: 15000000 });


  const TREXFactory = await ethers.getContractFactory('TREXFactory');
  const trexFactory = await TREXFactory.deploy(
    await trexImplementationAuthority.getAddress(),
    await identityFactory.getAddress(),
    { gasLimit: 15000000 }
  );
  await trexFactory.waitForDeployment();

  await identityFactory.addTokenFactory(await trexFactory.getAddress());

  const TREXGateway = await ethers.getContractFactory('TREXGateway');
  const trexGateway = await TREXGateway.deploy(
    await trexFactory.getAddress(),
    true,
    { gasLimit: 15000000 }
  );
  await trexGateway.waitForDeployment();

  await trexFactory.connect(deployer).transferOwnership(await trexGateway.getAddress());
  await identityFactory.connect(deployer).transferOwnership(await identityGateway.getAddress());

  return {
    ...contracts,
    implementations: {
      Token: await tokenImplementation.getAddress(),
      ClaimTopicsRegistry: await claimTopicsRegistryImplementation.getAddress(),
      TrustedIssuersRegistry: await trustedIssuersRegistryImplementation.getAddress(),
      IdentityRegistryStorage: await identityRegistryStorageImplementation.getAddress(),
      IdentityRegistry: await identityRegistryImplementation.getAddress(),
      ModularCompliance: await modularComplianceImplementation.getAddress(),
      Identity: await identityImplementation.getAddress(),
      ImplementationAuthority: await identityImplementationAuthority.getAddress(),
    },
    factories: {
      IdFactory: await identityFactory.getAddress(),
      TREXImplementationAuthority: await trexImplementationAuthority.getAddress(),
      TREXFactory: await trexFactory.getAddress(),
      TREXGateway: await trexGateway.getAddress(),
      IdentityGateway: await identityGateway.getAddress(),
    }
  }

}

async function deployComplianceModules(contracts: Record<string, any>): Promise<Record<string, any>> {
  const [deployer] = await ethers.getSigners();

  // Deploy compliance Modules
  const requiresNFTModule = await ethers.deployContract('RequiresNFTModule', deployer);
  const countryAllowModule = await ethers.deployContract('CountryAllowModule', deployer);
  const maxOwnershipByCountryModule = await ethers.deployContract('MaxOwnershipByCountryModule', deployer);

  return {
    ...contracts,
    compliance: {
      RequiresNFTModule: await requiresNFTModule.getAddress(),
      CountryAllowModule: await countryAllowModule.getAddress(),
      MaxOwnershipByCountryModule: await maxOwnershipByCountryModule.getAddress(),
    }
  }
}

// Deploy Vault contracts
async function deployVault(contracts: Record<string, any>): Promise<Record<string, any>> {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying Vault with account:", deployer.address, "at:", network.name);

  let client = Client.forTestnet();

  const operatorPrKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY || '');
  const operatorAccountId = AccountId.fromString(process.env.ACCOUNT_ID || '');

  client.setOperator(
    operatorAccountId,
    operatorPrKey
  );

  const stakingToken = await createFungibleToken(
    "ERC4626 on Hedera",
    "HERC4626",
    process.env.ACCOUNT_ID,
    operatorPrKey.publicKey,
    client,
    operatorPrKey
  );

  const stakingTokenAddress = "0x" + stakingToken!.toSolidityAddress();

  const rewardToken = await createFungibleToken(
    "Reward Token 1",
    "RT1",
    process.env.ACCOUNT_ID,
    operatorPrKey.publicKey,
    client,
    operatorPrKey
  );

  const feeConfig = {
    receiver: "0x091b4a7ea614a3bd536f9b62ad5641829a1b174f",
    token: "0x" + rewardToken!.toSolidityAddress(),
    minAmount: 0,
    feePercentage: 1000,
  };

  const HederaVault = await ethers.getContractFactory("HederaVault");
  const hederaVault = await HederaVault.deploy(
    stakingTokenAddress,
    "TST",
    "TST",
    feeConfig,
    deployer.address,
    deployer.address,
    { from: deployer.address, gasLimit: 3000000, value: ethers.parseUnits("12", 18) }
  );
  console.log("Hash ", hederaVault.deploymentTransaction()?.hash);
  await hederaVault.waitForDeployment();

  console.log("Vault deployed with address: ", await hederaVault.getAddress());

  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.deploy({ from: deployer.address });
  console.log("Hash ", vaultFactory.deploymentTransaction()?.hash);
  await vaultFactory.waitForDeployment();

  console.log("Vault Factory deployed with address: ", await vaultFactory.getAddress());

  return {
    ...contracts,
    vault: {
      Vault: hederaVault.target,
      VaultFactory: vaultFactory.target,
      StakingToken: stakingTokenAddress,
      Share: await hederaVault.share(),
      RewardToken: "0x" + rewardToken!.toSolidityAddress()
    }
  };
}

// deploy HTS Token Factory
async function deployHTSTokenFactory(contracts: Record<string, any>): Promise<Record<string, any>>  {
  const [owner] = await ethers.getSigners();

  const htsTokenFactoryDeployer = await ethers.getContractFactory("HTSTokenFactory");

  const htsTokenFactory = await htsTokenFactoryDeployer.connect(owner).deploy({ gasLimit: 4800000 });
  await htsTokenFactory.waitForDeployment();

  return {
    ...contracts,
    factories: {
      ...contracts.factories,
      HTSTokenFactory: await htsTokenFactory.getAddress()
    }
  }
}

// creates a deployment file into data/deployments (eg: data/deployments/mainnet.json)
async function exportDeploymentVersion(contracts: Record<string, any>): Promise<Record<string, any>> {
  console.log(' - Export Deployment contract addresses...');
  const network = await ethers.provider.getNetwork();
  const filePath = `./data/deployments/chain-${network.chainId.toString()}.json`
  const jsonData = JSON.stringify(contracts, null, 2);
  await writeFile(filePath, jsonData, 'utf-8');
  console.log(` - Deployment addresses written to ${filePath}`);

  return contracts;
}

// Finish function
async function finish(): Promise<void> {
  console.log(' - Finished');
  process.exit();
}

init()
  // add subsequent deployment script after this comment
  .then(deployERC3643)
  .then(deployComplianceModules)
  .then(deployVault)
  .then(deployHTSTokenFactory)
  .then(exportDeploymentVersion)
  .then(finish)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


