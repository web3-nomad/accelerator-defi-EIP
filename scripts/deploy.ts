import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { AbiCoder } from 'ethers';
import OnchainID from '@onchain-id/solidity';

async function deployIdentityProxy(implementationAuthority: Contract['address'], managementKey: string, signer: Signer) {
  const identity = await new ethers.ContractFactory(OnchainID.contracts.IdentityProxy.abi, OnchainID.contracts.IdentityProxy.bytecode, signer).deploy(
    implementationAuthority,
    managementKey,
  );

  await identity.waitForDeployment();

  return ethers.getContractAt(OnchainID.contracts.Identity.abi, await identity.getAddress(), signer);
}

async function deployClaimIssuer(managementKey: string, signer: Signer) {
  const claimIssuer = await new ethers.ContractFactory(OnchainID.contracts.ClaimIssuer.abi, OnchainID.contracts.ClaimIssuer.bytecode, signer).deploy(
    managementKey,
  );

  await claimIssuer.waitForDeployment();

  return ethers.getContractAt(OnchainID.contracts.ClaimIssuer.abi, await claimIssuer.getAddress(), signer);
}

async function deployFullSuiteFixture() {
  const [deployer] =
    await ethers.getSigners();
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  const aliceActionKey = ethers.Wallet.createRandom();

  const tokenIssuer = new ethers.Wallet(process.env.TOKEN_ISSUER + '', ethers.provider)
  const tokenAgent = new ethers.Wallet(process.env.TOKEN_AGENT + '', ethers.provider)
  const tokenAdmin = new ethers.Wallet(process.env.TOKEN_ADMIN + '', ethers.provider)
  const claimIssuer = new ethers.Wallet(process.env.CLAIM_ISSUER + '', ethers.provider)
  const aliceWallet = new ethers.Wallet(process.env.ALLICE_WALLET + '', ethers.provider)
  const bobWallet = new ethers.Wallet(process.env.BOB_WALLET + '', ethers.provider)

  console.log({deployer, tokenIssuer, tokenAgent, tokenAdmin, claimIssuer, aliceWallet, bobWallet})

  // const claimTopicsRegistryImplementation = await ethers.getContractAt("ClaimTopicsRegistry","0x18925781118e387DE7CaA7b4BC2E3FbC9B7FfDB4");
  // const trustedIssuersRegistryImplementation = await ethers.getContractAt("TrustedIssuersRegistry","0xbCf72B4f5040e07dFF33084C00E0f0D6b874B56D");
  // const identityRegistryStorageImplementation = await ethers.getContractAt("IdentityRegistryStorage","0xF700a5575006a32b50C040E7013F18F5C3584fdA");
  // const identityRegistryImplementation = await ethers.getContractAt("IdentityRegistry","0x53c0F259f465e0095F7a5bB41E2960A7af9E18B0");
  // const modularComplianceImplementation = await ethers.getContractAt("ModularCompliance","0x3940764fa1fe3848AFFc45B85C91542376bd7Cb8");
  // const tokenImplementation = await ethers.getContractAt("Token","0x15fBa70346980b6E2C9d407bd359b941759c5E83");
  // const identityImplementation = await ethers.getContractAt("Identity","0x368f433269Af901274A52D67A5c519348d135Baf");
  // const identityImplementationAuthority = await ethers.getContractAt("ImplementationAuthority","0xDfbdFCfEEc5203625Cf37e0622a34Adea89402d6");
  // const identityFactory = await ethers.getContractAt("IIdFactory","0x444b9bd687D96FDd436148344b7485b5E20F032f");
  // const trexImplementationAuthority = await ethers.getContractAt("TREXImplementationAuthority","0xCBd042E5DdcCe6bEAA11f57fA37536c609d0A786");
  // const trexFactory = await ethers.getContractAt("TREXFactory","0x23F4D2619f94466eb11c471769997DB79Eb995ac");
  // const claimTopicsRegistryProxy = await ethers.getContractAt("ClaimTopicsRegistry","0x77A86efba4bA5C4BFc631FB0cc2f1289991fE825");
  // const trustedIssuersRegistryProxy = await ethers.getContractAt("TrustedIssuersRegistry","0x3EF76AEEBad8FA97854B534678644af20525F1bE");
  // const identityRegistryStorageProxy = await ethers.getContractAt("IdentityRegistryStorage","0x7E9F4dF4C17AA71127E859D00140BbB7342b9B40");
  // const defaultCompliance = await ethers.getContractAt("DefaultCompliance","0x3120592479D6A7fADB13D6F6be5DeC56E541cF8c");
  // const identityRegistryProxy = await ethers.getContractAt("IdentityRegistry","0x7527c36287780A2fdBd3f02C0e3baB9a08B8D52A");
  // const tokenOID = await ethers.getContractAt("Token","0x7527c36287780A2fdBd3f02C0e3baB9a08B8D52A");
  // const tokenProxy = await ethers.getContractAt("Token", "0xef370AB9f86F366e59216837a476eB2E2F6A7a0B");
  // const agentManager = await ethers.getContractAt("AgentManager", "0x2F3082Ae57fcb56bf0a119f6475884b30856275f");
  // const claimIssuerContract = await ethers.getContractAt("ClaimIssuer", "0xc76a430E455D79Fc84716615F299e9c8c3E3969F");
  // const aliceIdentity = await ethers.getContractAt("IdentityRegistryProxy","0xEA28c99326e47fdaD6fE63A53567E0DBEbEb4651");
  // const bobIdentity = await ethers.getContractAt("IdentityRegistryProxy","0xCEe5c68C56AAA299f07aD2a7c1A41644E72E2EEF");

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

  const identityImplementation = await new ethers.ContractFactory(
    OnchainID.contracts.Identity.abi,
    OnchainID.contracts.Identity.bytecode,
    deployer,
  ).deploy(await deployer.getAddress(), true);
  console.log("identityImplementation", await identityImplementation.getAddress());
  const identityImplementationAuthority = await new ethers.ContractFactory(
    OnchainID.contracts.ImplementationAuthority.abi,
    OnchainID.contracts.ImplementationAuthority.bytecode,
    deployer,
  ).deploy(await identityImplementation.getAddress());
  console.log("identityImplementationAuthority", await identityImplementationAuthority.getAddress());

  const identityFactory = await new ethers.ContractFactory(OnchainID.contracts.Factory.abi, OnchainID.contracts.Factory.bytecode, deployer).deploy(
    await identityImplementationAuthority.getAddress(),
  );
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
  const trexImplementationAuthorityContract =  await ethers.getContractAt("TREXImplementationAuthority", await trexImplementationAuthority.getAddress());
  await trexImplementationAuthorityContract.addAndUseTREXVersion(versionStruct, contractsStruct, {
    gasLimit: 15000000,
  });
  console.log("addAndUseTREXVersion done");

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
  console.log("addTokenFactory done");
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

  console.log(
    {tokenIssuer}
  )
  
  // @ts-ignore
  const tokenOID = await deployIdentityProxy(await identityImplementationAuthority.getAddress(), await tokenIssuer.getAddress(), deployer);
  console.log({ tokenOID })
  console.log("tokenOID", await tokenOID.getAddress());

  const tokenName = 'TREXDINO';
  const tokenSymbol = 'TREX';
  const tokenDecimals = 0n;
  const token = await ethers
    .deployContract(
      'TokenProxy',
      [
        await trexImplementationAuthority.getAddress(),
        await identityRegistry.getAddress(),
        await defaultCompliance.getAddress(),
        tokenName,
        tokenSymbol,
        tokenDecimals,
       await tokenOID.getAddress(),
      ],
      deployer,
    )
    .then(async (proxy) => ethers.getContractAt('Token', await proxy.getAddress()));
  console.log("TokenProxy", await token.getAddress());
  console.log(1,{tokenAgent});
  const agentManager = await ethers.deployContract('AgentManager', [await token.getAddress()], tokenAgent);
  console.log("agentManager", await agentManager.getAddress());

  await identityRegistryStorage.connect(deployer).bindIdentityRegistry(await identityRegistry.getAddress());
  console.log("bindIdentityRegistry done");
  console.log(2,{tokenAgent});

  await token.connect(deployer).addAgent(await tokenAgent.getAddress());
  console.log("addAgent done");
  const claimTopics = [ethers.id('CLAIM_TOPIC')];
  await claimTopicsRegistry.connect(deployer).addClaimTopic(claimTopics[0]);
  console.log("addClaimTopic done");
    
  // const claimIssuerContract = await ethers.deployContract('ClaimIssuer', [await claimIssuer.getAddress()], deployer);
  // console.log("claimIssuerContract", await claimIssuerContract.getAddress());
  const claimIssuerContract = await deployClaimIssuer(await claimIssuer.getAddress(), deployer);
  console.log("claimIssuerContract", await claimIssuerContract.getAddress());

  await claimIssuerContract
  .connect(claimIssuer)
  //@ts-ignore
    .addKey(ethers.keccak256(AbiCoder.defaultAbiCoder().encode(['address'], [await claimIssuerSigningKey.getAddress()])), 3, 1);
  console.log("addKey done");
  await trustedIssuersRegistry.connect(deployer).addTrustedIssuer(await claimIssuerContract.getAddress(), claimTopics);
  console.log("addTrustedIssuer done");
  //@ts-ignore
  const aliceIdentity = await deployIdentityProxy(await identityImplementationAuthority.getAddress(), await aliceWallet.getAddress(), deployer);
  console.log("aliceIdentity", await aliceIdentity.getAddress());

  await  aliceIdentity
    .connect(aliceWallet)
    //@ts-ignore
    .addKey(ethers.keccak256(AbiCoder.defaultAbiCoder().encode(['address'], [await aliceActionKey.getAddress()])), 2, 1);
  console.log("addKey done");
  //@ts-ignore
  const bobIdentity = await deployIdentityProxy(await identityImplementationAuthority.getAddress(), await bobWallet.getAddress(), deployer);
  console.log("bobIdentity", await bobIdentity.getAddress());
  // // const charlieIdentity = await deployIdentityProxy(identityImplementationAuthority.getAddress(), charlieWallet.getAddress(), deployer);

  await identityRegistry.connect(deployer).addAgent(await tokenAgent.getAddress());
  console.log("addAgent Token done");
  await identityRegistry.connect(deployer).addAgent(await token.getAddress());
  console.log("addAgent done");

  await identityRegistry
    .connect(tokenAgent)
    .batchRegisterIdentity([await aliceWallet.getAddress(), await bobWallet.getAddress()], [await aliceIdentity.getAddress(), await bobIdentity.getAddress()], [42, 666]);
  console.log("batchRegisterIdentity done");
  const claimForAlice = {
    data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
    issuer: await claimIssuerContract.getAddress(),
    topic: claimTopics[0],
    scheme: 1,
    identity: await aliceIdentity.getAddress(),
    signature: '',
  };
  claimForAlice.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(
        AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForAlice.identity, claimForAlice.topic, claimForAlice.data]),
      ),
    ),
  );
  await aliceIdentity
    .connect(aliceWallet)
    //@ts-ignore
    .addClaim(claimForAlice.topic, claimForAlice.scheme, claimForAlice.issuer, claimForAlice.signature, claimForAlice.data, '');

  console.log("addClaim for Alice done");
  const claimForBob = {
    data: ethers.hexlify(ethers.toUtf8Bytes('Some claim public data.')),
    issuer: await claimIssuerContract.getAddress(),
    topic: claimTopics[0],
    scheme: 1,
    identity: await bobIdentity.getAddress(),
    signature: '',
  };
  claimForBob.signature = await claimIssuerSigningKey.signMessage(
    ethers.getBytes(
      ethers.keccak256(
        AbiCoder.defaultAbiCoder().encode(['address', 'uint256', 'bytes'], [claimForBob.identity, claimForBob.topic, claimForBob.data]),
      ),
    ),
  );
  await bobIdentity
    .connect(bobWallet)
    //@ts-ignore
    .addClaim(claimForBob.topic, claimForBob.scheme, claimForBob.issuer, claimForBob.signature, claimForBob.data, '');
  console.log("addClaim for Bob done");

  await token.connect(tokenAgent).mint(await aliceWallet.getAddress(), 1000);
  console.log("mint Alice done");
  await token.connect(tokenAgent).mint(await bobWallet.getAddress(), 500);
  console.log("mint Bob done");
  await agentManager.connect(tokenAgent).addAgentAdmin(await tokenAdmin.getAddress());
  console.log("addAgentAdmin done");
  await token.connect(deployer).addAgent(await agentManager.getAddress());
  console.log("addAgent done");
  await identityRegistry.connect(deployer).addAgent(await agentManager.getAddress());
  console.log("addAgent done");
  await token.connect(tokenAgent).unpause();
  console.log("unpause Token done");

  return {
    accounts: {
      deployer,
      tokenIssuer,
      tokenAgent,
      tokenAdmin,
      claimIssuer,
      claimIssuerSigningKey,
      aliceActionKey,
      aliceWallet,
      bobWallet,
    },
    identities: {
      aliceIdentity,
      bobIdentity,
      //charlieIdentity,
    },
    suite: {
      claimIssuerContract,
      claimTopicsRegistry,
      trustedIssuersRegistry,
      identityRegistryStorage,
      defaultCompliance,
      identityRegistry,
      tokenOID,
      token,
      agentManager,
    },
    authorities: {
      trexImplementationAuthority,
      identityImplementationAuthority,
    },
    factories: {
      trexFactory,
      identityFactory,
    },
    implementations: {
      identityImplementation,
      claimTopicsRegistryImplementation,
      trustedIssuersRegistryImplementation,
      identityRegistryStorageImplementation,
      identityRegistryImplementation,
      modularComplianceImplementation,
      tokenImplementation,
    },
  };
}

export async function deploySuiteWithModularCompliancesFixture() {
  const context = await deployFullSuiteFixture();

  // const complianceProxy = await ethers.deployContract('ModularComplianceProxy', [context.authorities.trexImplementationAuthority.getAddress()]);
  // console.log("complianceProxy", complianceProxy.getAddress());
  const compliance = await ethers.getContractAt('ModularCompliance', "0x15D8C405E33DDB6cAe32F029cb4B05A776a1d090");

  // const complianceBeta = await ethers.deployContract('ModularCompliance');
  const complianceBeta = await ethers.getContractAt("ModularCompliance", "0x445782C538828CB99345dC7212F0DFc8c186637A");
  //console.log("complianceBeta", complianceBeta.getAddress());
  //await complianceBeta.init();

  return {
    ...context,
    suite: {
      ...context.suite,
      compliance,
      complianceBeta,
    },
  };
}

export async function deploySuiteWithModuleComplianceBoundToWallet() {
  const context = await deployFullSuiteFixture();

  //const compliance = await ethers.deployContract('ModularCompliance');
  const compliance = await ethers.getContractAt('ModularCompliance', "0x15D8C405E33DDB6cAe32F029cb4B05A776a1d090");
  //await compliance.init();

  //const complianceModuleA = await ethers.deployContract('CountryAllowModule');
  //console.log("complianceModuleA", complianceModuleA.getAddress());
  const complianceModuleA = await ethers.getContractAt('CountryAllowModule', "0xEE3f2a091e145959BBa820fd9b39E1aE288c4533");
  //await compliance.addModule(complianceModuleA.getAddress());
  // const complianceModuleB = await ethers.deployContract('CountryAllowModule');
  // console.log("complianceModuleB", complianceModuleB.getAddress());
  const complianceModuleB = await ethers.getContractAt('CountryAllowModule', "0xc03563DeaA4AA9F462b6A23835a3Ad78456a308F");
  //await compliance.addModule(complianceModuleB.getAddress());

  //await compliance.bindToken(context.accounts.charlieWallet.getAddress());

  return {
    ...context,
    suite: {
      ...context.suite,
      compliance,
      complianceModuleA,
      complianceModuleB,
    },
  };
}


deployFullSuiteFixture()
  .catch(console.error);
