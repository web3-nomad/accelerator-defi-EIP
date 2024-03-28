import { ethers } from 'hardhat';
import { writeFile } from 'fs/promises';

// Initial function for logs and configs
async function init(): Promise<Record<string, string>> {
  console.log(" - Deploying contracts...");
  return {};
}

// Deploy main contracts for the ERC3643 Standart (T-REX)
async function deployERC3643(contracts: Record<string, string>): Promise<Record<string, string>> {
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

  const trexImplementationAuthorityContract =  await ethers.getContractAt(
    "TREXImplementationAuthority", 
    await trexImplementationAuthority.getAddress()
  );

  await trexImplementationAuthorityContract.addAndUseTREXVersion(versionStruct, contractsStruct, { gasLimit: 15000000 });


  const TREXFactory = await ethers.getContractFactory('TREXFactory');
  const trexFactory = await TREXFactory.deploy(
    await trexImplementationAuthority.getAddress(), 
    await identityFactory.getAddress(),{ gasLimit: 15000000 }
  );
  await trexFactory.waitForDeployment();

  await identityFactory.addTokenFactory(await trexFactory.getAddress());

  return {
    ...contracts,
    tokenImplementation: await tokenImplementation.getAddress(),
    claimTopicsRegistryImplementation: await claimTopicsRegistryImplementation.getAddress(),
    trustedIssuersRegistryImplementation: await trustedIssuersRegistryImplementation.getAddress(),
    identityRegistryStorageImplementation: await identityRegistryStorageImplementation.getAddress(),
    identityRegistryImplementation: await identityRegistryImplementation.getAddress(),
    modularComplianceImplementation: await modularComplianceImplementation.getAddress(),
    identityImplementation: await identityImplementation.getAddress(),
    identityImplementationAuthority: await identityImplementationAuthority.getAddress(),
    identityFactory: await identityFactory.getAddress(),
    trexImplementationAuthority: await trexImplementationAuthority.getAddress(),
    trexFactory: await trexFactory.getAddress(),
  }

}

async function deployComplianceModules(contracts: Record<string, string>): Promise<Record<string, string>> {
  const [deployer] = await ethers.getSigners();

  // Deploy compliance Modules
  const requiresNFTModule = await ethers.deployContract('RequiresNFTModule', deployer);
  const countryAllowModule = await ethers.deployContract('CountryAllowModule', deployer);

  return {
    ...contracts,
    requiresNFTModule: await requiresNFTModule.getAddress(),
    countryAllowModule: await countryAllowModule.getAddress(),
  }
}

// Deploy Vault contracts
async function deployVault(contracts: Record<string, string>): Promise<Record<string, string>> {
  console.log(' - Deploying Vault contracts...');
  return {
    ...contracts
  };
}

// creates a deployment file into data/deployments (eg: data/deployments/mainnet.json)
async function exportDeploymentVersion(contracts: Record<string, string>): Promise<Record<string, string>> {
  console.log(' - Export Deployment contract addresses...');
  const network = await ethers.provider.getNetwork();
  const filePath = `./data/deployments/${network.name.toLowerCase()}.json`
  const jsonData = JSON.stringify(contracts, null, 2);
  await writeFile(filePath, jsonData, 'utf-8');
  console.log(` - Deployment addresses written to ${filePath}`);

  return {
    ...contracts
  }
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
  .then(exportDeploymentVersion)
  .then(finish)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

  
