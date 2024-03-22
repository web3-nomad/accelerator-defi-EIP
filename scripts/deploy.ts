import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { AbiCoder } from 'ethers';
// import OnchainID from '@onchain-id/solidity';

async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
  // const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
  //   implementationAuthority,
  //   managementKey,
  // );
  const identity = await ethers.deployContract('IdentityProxy', [implementationAuthority, managementKey], signer);
  await identity.waitForDeployment();

  return ethers.getContractAt('Identity', await identity.getAddress(), signer);
}

async function deployClaimIssuer(managementKey: string, signer: Signer) {
  // const claimIssuer = await new ethers.ContractFactory(OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, signer).deploy(
  //   managementKey,
  // );
  const claimIssuer = await ethers.deployContract('ClaimIssuer', [managementKey], signer);
  await claimIssuer.waitForDeployment();

  return ethers.getContractAt('ClaimIssuer', await claimIssuer.getAddress(), signer);
}

async function deployTRex() {
  const [deployer] = await ethers.getSigners();
  
  const claimIssuerSigningKey = deployer;
  const tokenIssuer = deployer
  const claimIssuer = deployer

  //Deploy implementations
  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
  console.log("claimTopicsRegistryImplementation", await claimTopicsRegistryImplementation.getAddress());
  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
  console.log("trustedIssuersRegistryImplementation", await trustedIssuersRegistryImplementation.getAddress());
  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
  console.log("identityRegistryStorageImplementation", await identityRegistryStorageImplementation.getAddress());
  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
  console.log("identityRegistryImplementation", await identityRegistryImplementation.getAddress());
  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
  console.log("modularComplianceImplementation", await modularComplianceImplementation.getAddress());
  const tokenImplementation = await ethers.deployContract('Token', deployer);
  console.log("tokenImplementation", await tokenImplementation.getAddress());

  // const identityImplementation = await new ethers.ContractFactory(
  //   OnchainID.contracts.Identity.abi,
  //   OnchainID.contracts.Identity.bytecode,
  //   deployer,
  // ).deploy(await deployer.getAddress(), true);
  const identityImplementation = await ethers.deployContract('Identity', [deployer.address, true], deployer);
  console.log("identityImplementation", await identityImplementation.getAddress());

  // const identityImplementationAuthority = await new ethers.ContractFactory(
  //   OnchainID.contracts.ImplementationAuthority.abi,
  //   OnchainID.contracts.ImplementationAuthority.bytecode,
  //   deployer,
  // ).deploy(await identityImplementation.getAddress());
  const identityImplementationAuthority = await ethers.deployContract('ImplementationAuthority', [await identityImplementation.getAddress()], deployer);
  console.log("identityImplementationAuthority", await identityImplementationAuthority.getAddress());

  // const identityFactory = await new ethers.ContractFactory(
  //   OnchainID.contracts.Factory.abi, 
  //   OnchainID.contracts.Factory.bytecode, 
  //   deployer
  // ).deploy(await identityImplementationAuthority.getAddress(),);
  const identityFactory = await ethers.deployContract('IdFactory', [await identityImplementationAuthority.getAddress()], deployer);
  console.log("identityFactory", await identityFactory.getAddress());

  const trexImplementationAuthority = await ethers.deployContract(
    'TREXImplementationAuthority',
    [true, ethers.ZeroAddress, ethers.ZeroAddress],
    deployer,
  );
  console.log("trexImplementationAuthority", await trexImplementationAuthority.getAddress());

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

  await trexImplementationAuthorityContract.addAndUseTREXVersion(versionStruct, contractsStruct, {
    gasLimit: 15000000,
  });

  const TREXFactory = await ethers.getContractFactory('TREXFactory');
  const trexFactory = await TREXFactory.deploy(
    await trexImplementationAuthority.getAddress(), 
    await identityFactory.getAddress(),
    {
      gasLimit: 15000000,
    }
  );
  await trexFactory.waitForDeployment();
  console.log("trexFactory", await trexFactory.getAddress());

  // @ts-ignore
  await identityFactory.addTokenFactory(await trexFactory.getAddress());

  const claimTopicsRegistry = await ethers
    .deployContract('ClaimTopicsRegistryProxy', [await trexImplementationAuthority.getAddress()], deployer)
    .then(async (proxy) => ethers.getContractAt('ClaimTopicsRegistry', await proxy.getAddress()));
  console.log("claimTopicsRegistryProxy", await claimTopicsRegistry.getAddress());

  const trustedIssuersRegistry = await ethers
    .deployContract('TrustedIssuersRegistryProxy', [await trexImplementationAuthority.getAddress()], deployer)
    .then(async (proxy) => ethers.getContractAt('TrustedIssuersRegistry', await proxy.getAddress()));
  console.log("trustedIssuersRegistryProxy", await trustedIssuersRegistry.getAddress());

  const identityRegistryStorage = await ethers
    .deployContract('IdentityRegistryStorageProxy', [await trexImplementationAuthority.getAddress()], deployer)
    .then(async (proxy) => ethers.getContractAt('IdentityRegistryStorage', await proxy.getAddress()));
  console.log("identityRegistryStorageProxy", await identityRegistryStorage.getAddress());

  const defaultCompliance = await ethers.deployContract('DefaultCompliance', deployer);
  console.log("defaultCompliance", await defaultCompliance.getAddress());

  const identityRegistry = await ethers
    .deployContract(
      'IdentityRegistryProxy',
      [await trexImplementationAuthority.getAddress(), await trustedIssuersRegistry.getAddress(), await claimTopicsRegistry.getAddress() , await identityRegistryStorage.getAddress()],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('IdentityRegistry', await proxy.getAddress()));
  console.log("identityRegistryProxy", await identityRegistry.getAddress());
  
  // @ts-ignore
  const tokenOID = await deployIdentityProxy(await identityImplementationAuthority.getAddress(), await tokenIssuer.getAddress(), deployer);
  console.log("tokenOID", await tokenOID.getAddress());

  await identityRegistryStorage.connect(deployer).bindIdentityRegistry(await identityRegistry.getAddress());


  const claimTopics = [ethers.id('CLAIM_TOPIC')];
  await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
    
  const claimIssuerContract = await deployClaimIssuer(await claimIssuer.getAddress(), deployer);
  console.log("claimIssuerContract", await claimIssuerContract.getAddress());

  await claimIssuerContract
    .connect(claimIssuer)
    //@ts-ignore
    .addKey(ethers.keccak256(AbiCoder.defaultAbiCoder().encode(['address'], [await claimIssuerSigningKey.getAddress()])), 3, 1);

  await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(await claimIssuerContract.getAddress(), claimTopics); 

  console.log('done');
}

deployTRex()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

  
